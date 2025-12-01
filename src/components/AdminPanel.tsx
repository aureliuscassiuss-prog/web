import { useState, useEffect } from 'react'
import {
    Check, X, Clock, FileText, AlertCircle, Shield, Calendar,
    User, Loader2, Plus, Trash2, Settings, Layers, BookOpen,
    Ban, Upload as UploadIcon, ExternalLink, ChevronRight, Search
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// --- Types ---
interface PendingResource {
    _id: string
    title: string
    description: string
    uploaderName: string
    driveLink: string
    type: string
    branch: string
    year: string
    subject: string
    unit?: string
    createdAt: string
}

interface UserData {
    _id: string
    name: string
    email: string
    role: string
    reputation: number
    isBanned: boolean
    canUpload: boolean
}

interface Program {
    id: string
    name: string
    years: Year[]
}

interface Year {
    id: string
    name: string
    courses: Course[]
}

interface Course {
    id: string
    name: string
    subjects: (string | SubjectObject)[]
}

interface SubjectObject {
    name: string
    units?: string[]
}

// --- Main Component ---
export default function AdminPanel() {
    const { token } = useAuth()

    // Tabs & Data State
    const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'structure'>('pending')
    const [pendingResources, setPendingResources] = useState<PendingResource[]>([])
    const [users, setUsers] = useState<UserData[]>([])
    const [structure, setStructure] = useState<{ programs: Program[] }>({ programs: [] })

    // Loading State
    const [isLoading, setIsLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Structure Selection State
    const [selectedProgramId, setSelectedProgramId] = useState<string>('')
    const [selectedYearId, setSelectedYearId] = useState<string>('')
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')
    const [selectedSubjectName, setSelectedSubjectName] = useState<string>('')

    // New Item Input State
    const [newProgram, setNewProgram] = useState('')
    const [newYear, setNewYear] = useState('')
    const [newBranch, setNewBranch] = useState('')
    const [newSubject, setNewSubject] = useState('')
    const [newUnit, setNewUnit] = useState('')

    // Fetch Data on Tab Change
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                if (activeTab === 'pending') await fetchPendingResources()
                else if (activeTab === 'users') await fetchUsers()
                else if (activeTab === 'structure') await fetchStructure()
            } catch (err) {
                console.error("Data fetch error:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [activeTab])

    // --- API Calls ---
    const fetchPendingResources = async () => {
        const res = await fetch('/api/admin?action=pending', { headers: { 'Authorization': `Bearer ${token}` } })
        const data = await res.json()
        if (res.ok) setPendingResources(data.resources || [])
    }

    const fetchUsers = async () => {
        const res = await fetch('/api/admin?action=users', { headers: { 'Authorization': `Bearer ${token}` } })
        const data = await res.json()
        if (res.ok) setUsers(data.users || [])
    }

    const fetchStructure = async () => {
        const res = await fetch('/api/admin?action=structure', { headers: { 'Authorization': `Bearer ${token}` } })
        const data = await res.json()
        if (res.ok) setStructure(data)
    }

    // --- Actions ---
    const handleResourceAction = async (resourceId: string, action: 'approve' | 'reject') => {
        setProcessingId(resourceId)
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action, resourceId })
            })
            if (res.ok) setPendingResources(prev => prev.filter(r => r._id !== resourceId))
        } catch (err) { console.error(err) } finally { setProcessingId(null) }
    }

    const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'restrict-upload' | 'allow-upload' | 'delete') => {
        if (action === 'delete' && !confirm('Are you sure? This will delete all user uploads.')) return
        setProcessingId(userId)
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userAction: true, action, userId })
            })
            if (res.ok) {
                if (action === 'delete') setUsers(prev => prev.filter(u => u._id !== userId))
                else fetchUsers() // Refresh to see status update
            }
        } catch (err) { console.error(err) } finally { setProcessingId(null) }
    }

    const handleStructureAdd = async (type: 'program' | 'year' | 'course' | 'subject' | 'unit', value: string) => {
        if (!value.trim()) return
        if (type === 'unit' && !selectedSubjectName) return alert('Please select a subject first.')

        const payload: any = { action: 'structure', value }

        // Construct payload based on type
        if (type === 'program') payload.structureAction = 'add-program'
        else if (type === 'year') { payload.structureAction = 'add-year'; payload.programId = selectedProgramId }
        else if (type === 'course') { payload.structureAction = 'add-course'; payload.programId = selectedProgramId; payload.yearId = selectedYearId }
        else if (type === 'subject') { payload.structureAction = 'add-subject'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId }
        else if (type === 'unit') { payload.structureAction = 'add-unit'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId; payload.subjectName = selectedSubjectName }

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                const data = await res.json()
                setStructure(data)
                // Clear input
                if (type === 'program') setNewProgram('')
                if (type === 'year') setNewYear('')
                if (type === 'course') setNewBranch('')
                if (type === 'subject') setNewSubject('')
                if (type === 'unit') setNewUnit('')
            } else {
                const errorData = await res.json()
                alert(errorData.message || 'Failed to add item')
            }
        } catch (err) { console.error(err); alert('Failed to add item') }
    }

    const handleStructureRemove = async (type: 'program' | 'year' | 'course' | 'subject' | 'unit', value: string) => {
        if (!confirm(`Delete "${value}"? This cannot be undone.`)) return

        const payload: any = { action: 'structure', value }
        if (type === 'program') { payload.structureAction = 'remove-program'; payload.programId = value }
        else if (type === 'year') { payload.structureAction = 'remove-year'; payload.programId = selectedProgramId; payload.yearId = value }
        else if (type === 'course') { payload.structureAction = 'remove-course'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = value }
        else if (type === 'subject') { payload.structureAction = 'remove-subject'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId; payload.value = value }
        else if (type === 'unit') { payload.structureAction = 'remove-unit'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId; payload.subjectName = selectedSubjectName; payload.value = value }

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                const data = await res.json()
                setStructure(data)
            }
        } catch (err) { console.error(err) }
    }

    // --- Derived State for Structure ---
    const programs = structure.programs || []
    const selectedProgram = programs.find(p => p.id === selectedProgramId)
    const years = selectedProgram?.years || []
    const selectedYear = years.find(y => y.id === selectedYearId)
    const courses = selectedYear?.courses || []
    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    const subjects = selectedCourse?.subjects || []
    const getSubjectName = (s: any) => typeof s === 'string' ? s : s.name
    const selectedSubject = subjects.find(s => getSubjectName(s) === selectedSubjectName)
    const units = (selectedSubject && typeof selectedSubject === 'object' && selectedSubject.units) ? selectedSubject.units : []

    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage platform content and configurations.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        <Shield className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span>Secure Mode Active</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex gap-1 p-1 bg-gray-200/50 dark:bg-white/5 rounded-xl w-max sm:w-auto">
                        <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} icon={<Clock size={16} />} label="Approvals" count={pendingResources.length} />
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<User size={16} />} label="Users" />
                        <TabButton active={activeTab === 'structure'} onClick={() => setActiveTab('structure')} icon={<Settings size={16} />} label="Structure" />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'pending' && <PendingView resources={pendingResources} processingId={processingId} onAction={handleResourceAction} />}
                            {activeTab === 'users' && <UsersView users={users} processingId={processingId} onAction={handleUserAction} />}
                            {activeTab === 'structure' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start overflow-x-auto pb-8">
                                    <StructureCard
                                        title="Programs"
                                        step="01"
                                        items={programs.map(p => ({ id: p.id, name: p.name }))}
                                        value={newProgram}
                                        setValue={setNewProgram}
                                        onAdd={() => handleStructureAdd('program', newProgram)}
                                        onRemove={(id: string) => handleStructureRemove('program', id)}
                                        activeId={selectedProgramId}
                                        onSelect={setSelectedProgramId}
                                    />
                                    <StructureCard
                                        title="Years"
                                        step="02"
                                        items={years.map(y => ({ id: y.id, name: y.name }))}
                                        value={newYear}
                                        setValue={setNewYear}
                                        onAdd={() => handleStructureAdd('year', newYear)}
                                        onRemove={(id: string) => handleStructureRemove('year', id)}
                                        activeId={selectedYearId}
                                        onSelect={setSelectedYearId}
                                        disabled={!selectedProgramId}
                                        parentName={selectedProgram?.name}
                                    />
                                    <StructureCard
                                        title="Branches"
                                        step="03"
                                        items={courses.map(c => ({ id: c.id, name: c.name }))}
                                        value={newBranch}
                                        setValue={setNewBranch}
                                        onAdd={() => handleStructureAdd('course', newBranch)}
                                        onRemove={(id: string) => handleStructureRemove('course', id)}
                                        activeId={selectedCourseId}
                                        onSelect={setSelectedCourseId}
                                        disabled={!selectedYearId}
                                        parentName={selectedYear?.name}
                                    />
                                    <StructureCard
                                        title="Subjects"
                                        step="04"
                                        items={subjects.map(s => ({
                                            id: typeof s === 'string' ? s : s.name,
                                            name: typeof s === 'string' ? s : s.name
                                        }))}
                                        value={newSubject}
                                        setValue={setNewSubject}
                                        onAdd={() => handleStructureAdd('subject', newSubject)}
                                        onRemove={(id: string) => handleStructureRemove('subject', id)}
                                        activeId={selectedSubjectName}
                                        onSelect={setSelectedSubjectName}
                                        disabled={!selectedCourseId}
                                        parentName={selectedCourse?.name}
                                    />
                                    <StructureCard
                                        title="Units"
                                        step="05"
                                        items={units.map(u => ({ id: u, name: u }))}
                                        value={newUnit}
                                        setValue={setNewUnit}
                                        onAdd={() => handleStructureAdd('unit', newUnit)}
                                        onRemove={(id: string) => handleStructureRemove('unit', id)}
                                        disabled={!selectedSubjectName}
                                        parentName={selectedSubjectName}
                                        isLast
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// --- Sub Components ---

function TabButton({ active, onClick, icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all
                ${active
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300'}
            `}
        >
            {icon}
            {label}
            {count > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                    {count}
                </span>
            )}
        </button>
    )
}

function PendingView({ resources, processingId, onAction }: any) {
    if (resources.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-full mb-4">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Caught Up</h3>
                <p className="text-gray-500 text-sm">No pending resources to review.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((res: PendingResource) => (
                <div key={res._id} className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className={`
                            px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                            ${res.type === 'notes' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                res.type === 'paper' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
                        `}>
                            {res.type}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            {new Date(res.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {res.title}
                    </h3>

                    <div className="space-y-1.5 mb-5">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <User size={12} className="shrink-0" />
                            <span className="truncate">{res.uploaderName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <BookOpen size={12} className="shrink-0" />
                            <span className="truncate">{res.subject}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Layers size={12} className="shrink-0" />
                            <span className="truncate">{res.branch} • {res.year}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <a href={res.driveLink} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-xs font-medium transition-colors">
                            <ExternalLink size={14} /> View
                        </a>
                        <button onClick={() => onAction(res._id, 'approve')} disabled={!!processingId}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-medium transition-colors disabled:opacity-50">
                            {processingId === res._id ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Approve</>}
                        </button>
                        <button onClick={() => onAction(res._id, 'reject')} disabled={!!processingId}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

function UsersView({ users, processingId, onAction }: any) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-black/20 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.map((user: any) => (
                            <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                            <span className="text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.role === 'admin' && <StatusBadge type="admin" label="ADMIN" />}
                                        {user.isBanned && <StatusBadge type="danger" label="BANNED" />}
                                        {!user.canUpload && !user.isBanned && <StatusBadge type="warning" label="RESTRICTED" />}
                                        {!user.isBanned && user.canUpload !== false && user.role !== 'admin' && <StatusBadge type="success" label="ACTIVE" />}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {user.role !== 'admin' && (
                                        <div className="flex items-center justify-end gap-2">
                                            {user.isBanned ? (
                                                <ActionButton onClick={() => onAction(user._id, 'unban')} disabled={processingId === user._id} icon={<Check size={14} />} label="Unban" variant="success" />
                                            ) : (
                                                <>
                                                    <ActionButton
                                                        onClick={() => onAction(user._id, user.canUpload !== false ? 'restrict-upload' : 'allow-upload')}
                                                        disabled={processingId === user._id}
                                                        icon={user.canUpload !== false ? <Ban size={14} /> : <UploadIcon size={14} />}
                                                        variant="ghost"
                                                        title={user.canUpload !== false ? 'Restrict Uploads' : 'Allow Uploads'}
                                                    />
                                                    <ActionButton
                                                        onClick={() => onAction(user._id, 'ban')}
                                                        disabled={processingId === user._id}
                                                        icon={<Ban size={14} />}
                                                        variant="ghost-danger"
                                                        title="Ban User"
                                                    />
                                                    <ActionButton
                                                        onClick={() => onAction(user._id, 'delete')}
                                                        disabled={processingId === user._id}
                                                        icon={<Trash2 size={14} />}
                                                        variant="danger"
                                                        title="Delete User"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StructureCard({ title, step, items, value, setValue, onAdd, onRemove, activeId, onSelect, disabled, parentName, isLast }: any) {
    return (
        <div className={`
            flex flex-col h-[400px] w-full min-w-[280px] rounded-xl border bg-white dark:bg-gray-900 shadow-sm transition-all duration-300
            ${disabled
                ? 'border-gray-100 opacity-50 dark:border-gray-800'
                : 'border-gray-200 dark:border-gray-800 ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700'}
        `}>
            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step {step}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${disabled ? 'bg-gray-300 dark:bg-gray-700' : 'bg-green-500'}`}></span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-xs text-gray-500 h-4 truncate">
                    {disabled ? 'Select previous step' : parentName ? `in ${parentName}` : 'Root level'}
                </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {!disabled && items.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                        <Layers size={20} className="mb-2 opacity-20" />
                        No {title.toLowerCase()} found
                    </div>
                )}

                {items.map((item: any) => (
                    <div
                        key={item.id}
                        onClick={() => !isLast && onSelect && onSelect(item.id)}
                        className={`
                            group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
                            ${activeId === item.id
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                        `}
                    >
                        <span className="truncate flex-1">{item.name}</span>
                        <div className="flex items-center gap-1">
                            {!isLast && (
                                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 ${activeId === item.id ? 'opacity-100' : ''}`} />
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                                className={`p-1 rounded hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 ${activeId === item.id ? 'text-gray-300 hover:text-red-200' : 'text-gray-400'}`}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Input */}
            <div className="flex-none p-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !disabled && onAdd()}
                        disabled={disabled}
                        placeholder={`Add ${title}...`}
                        className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800 border-0 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        onClick={onAdd}
                        disabled={disabled || !value.trim()}
                        className="flex-none p-2 rounded-md bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- Utility Components ---

function StatusBadge({ type, label }: { type: 'success' | 'warning' | 'danger' | 'admin', label: string }) {
    const styles = {
        success: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30',
        warning: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30',
        danger: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
        admin: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
    }
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${styles[type]}`}>
            {label}
        </span>
    )
}

function ActionButton({ onClick, disabled, icon, label, variant = 'ghost', title }: any) {
    const variants: any = {
        success: 'bg-green-600 text-white hover:bg-green-700',
        danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30',
        ghost: 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10',
        'ghost-danger': 'text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
                flex items-center justify-center gap-1.5 p-1.5 rounded-lg transition-colors disabled:opacity-50
                ${label ? 'px-3 py-1.5 text-xs font-medium' : ''}
                ${variants[variant]}
            `}
        >
            {icon}
            {label}
        </button>
    )
}