import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
    Check, X, Clock, AlertCircle, Shield,
    User, Plus, Trash2, Settings, Layers,
    Ban, ExternalLink, ChevronRight, Search, GripVertical
} from 'lucide-react'
import TyreLoader from './TyreLoader'
import { useAuth } from '../contexts/AuthContext'

// --- Types ---
interface PendingResource {
    _id: string
    title: string
    description: string
    uploaderName: string
    uploaderAvatar?: string
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
    avatar?: string
    isBanned?: boolean
    isRestricted?: boolean
    isTrusted?: boolean
    canUpload?: boolean
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
    semesters: Semester[]
}

interface Semester {
    id: string
    name: string
    subjects: (string | SubjectObject)[]
}

interface SubjectObject {
    name: string
    units?: (string | UnitObject)[]
}

interface UnitObject {
    name: string
    videos?: VideoObject[]
}

interface VideoObject {
    id: string
    title: string
    url: string
}

// --- Main Component ---
export default function AdminPanel() {
    const { token } = useAuth()

    // Tabs & Data State
    const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'structure'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('adminActiveTab') as 'pending' | 'users' | 'structure') || 'pending'
        }
        return 'pending'
    })

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab)
    }, [activeTab])
    const [pendingResources, setPendingResources] = useState<PendingResource[]>([])
    const [users, setUsers] = useState<UserData[]>([])
    const [structure, setStructure] = useState<{ programs: Program[] }>({ programs: [] })

    // Loading State
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)

    // Structure Selection State
    const [selectedProgramId, setSelectedProgramId] = useState<string>('')
    const [selectedYearId, setSelectedYearId] = useState<string>('')
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')
    const [selectedSubjectName, setSelectedSubjectName] = useState<string>('')
    const [selectedUnitName, setSelectedUnitName] = useState<string>('')

    // New Item Input State
    const [newProgram, setNewProgram] = useState('')
    const [newYear, setNewYear] = useState('')
    const [newSemester, setNewSemester] = useState('')
    const [newBranch, setNewBranch] = useState('')
    const [newSubject, setNewSubject] = useState('')
    const [newUnit, setNewUnit] = useState('')
    const [newVideoTitle, setNewVideoTitle] = useState('')
    const [newVideoUrl, setNewVideoUrl] = useState('')

    // Helper for Semester Auto-text
    const handleSemesterChange = (val: string) => {
        if (/^\d+$/.test(val)) {
            setNewSemester(`Semester ${val}`)
        } else {
            setNewSemester(val)
        }
    }

    // Helper for Unit Auto-text
    const handleUnitChange = (val: string) => {
        if (/^\d+$/.test(val)) {
            setNewUnit(`Unit ${val}`)
        } else {
            setNewUnit(val)
        }
    }

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

    const handleUserAction = async (userId: string, action: string, role?: string) => {
        if (action === 'delete' && !confirm('Are you sure? This will delete all user uploads.')) return
        setProcessingId(userId)
        try {
            const body: any = { userAction: true, action, userId }
            if (role) body.role = role

            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            })
            if (res.ok) {
                if (action === 'delete') setUsers(prev => prev.filter(u => u._id !== userId))
                else fetchUsers()
            }
        } catch (err) { console.error(err) } finally { setProcessingId(null) }
    }

    const handleStructureAdd = async (type: 'program' | 'year' | 'semester' | 'course' | 'subject' | 'unit' | 'video', value: string) => {
        if (!value.trim()) return
        if (type === 'unit' && !selectedSubjectName) return alert('Please select a subject first.')
        if (type === 'video' && !selectedUnitName) return alert('Please select a unit first.')

        setIsSubmitting(true)
        const payload: any = { action: 'structure', value }

        if (type === 'program') payload.structureAction = 'add-program'
        else if (type === 'year') { payload.structureAction = 'add-year'; payload.programId = selectedProgramId }
        else if (type === 'course') { payload.structureAction = 'add-course'; payload.programId = selectedProgramId; payload.yearId = selectedYearId }
        else if (type === 'semester') { payload.structureAction = 'add-semester'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId }
        else if (type === 'subject') { payload.structureAction = 'add-subject'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId; payload.semesterId = selectedSemesterId }
        else if (type === 'unit') { payload.structureAction = 'add-unit'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId; payload.semesterId = selectedSemesterId; payload.subjectName = selectedSubjectName }
        else if (type === 'video') {
            payload.structureAction = 'add-video'
            payload.programId = selectedProgramId
            payload.yearId = selectedYearId
            payload.courseId = selectedCourseId
            payload.semesterId = selectedSemesterId
            payload.subjectName = selectedSubjectName
            payload.unitName = selectedUnitName
            payload.videoTitle = value
            payload.videoUrl = newVideoUrl
        }

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                const data = await res.json()
                setStructure(data)
                if (type === 'program') setNewProgram('')
                if (type === 'year') setNewYear('')
                if (type === 'semester') setNewSemester('')
                if (type === 'course') setNewBranch('')
                if (type === 'subject') setNewSubject('')
                if (type === 'unit') setNewUnit('')
                if (type === 'video') { setNewVideoTitle(''); setNewVideoUrl('') }
            } else {
                const errorData = await res.json()
                alert(errorData.message || 'Failed to add item')
            }
        } catch (err) { console.error(err); alert('Failed to add item') } finally { setTimeout(() => setIsSubmitting(false), 500) }
    }

    const handleStructureRemove = async (type: 'program' | 'year' | 'semester' | 'course' | 'subject' | 'unit' | 'video', value: string) => {
        if (!confirm(`Delete "${value}" ? This cannot be undone.`)) return

        setRemovingId(value)
        const payload: any = { action: 'structure', value }
        if (type === 'program') { payload.structureAction = 'remove-program'; payload.programId = value }
        else if (type === 'year') { payload.structureAction = 'remove-year'; payload.programId = selectedProgramId; payload.yearId = value }
        else if (type === 'course') { payload.structureAction = 'remove-course'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = value }
        else if (type === 'semester') { payload.structureAction = 'remove-semester'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId; payload.semesterId = value }
        else if (type === 'subject') { payload.structureAction = 'remove-subject'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId; payload.semesterId = selectedSemesterId; payload.value = value }
        else if (type === 'unit') { payload.structureAction = 'remove-unit'; payload.programId = selectedProgramId; payload.yearId = selectedYearId; payload.courseId = selectedCourseId; payload.semesterId = selectedSemesterId; payload.subjectName = selectedSubjectName; payload.value = value }
        else if (type === 'video') {
            payload.structureAction = 'remove-video'
            payload.programId = selectedProgramId
            payload.yearId = selectedYearId
            payload.courseId = selectedCourseId
            payload.semesterId = selectedSemesterId
            payload.subjectName = selectedSubjectName
            payload.unitName = selectedUnitName
            payload.videoId = value
        }

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
        } catch (err) { console.error(err) } finally { setTimeout(() => setRemovingId(null), 500) }
    }

    // --- Derived State for Structure ---
    const programs = structure.programs || []
    const selectedProgram = programs.find(p => p.id === selectedProgramId)
    const years = selectedProgram?.years || []
    const selectedYear = years.find(y => y.id === selectedYearId)
    const courses = selectedYear?.courses || []
    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    const semesters = selectedCourse?.semesters || []
    const selectedSemester = semesters.find(s => s.id === selectedSemesterId)
    const subjects = selectedSemester?.subjects || []
    const getSubjectName = (s: any) => typeof s === 'string' ? s : s.name
    const selectedSubject = subjects.find(s => getSubjectName(s) === selectedSubjectName)
    const units = (selectedSubject && typeof selectedSubject === 'object' && selectedSubject.units)
        ? selectedSubject.units.map((u: any) => typeof u === 'string' ? { name: u, videos: [] } : u)
        : []
    const selectedUnit = units.find((u: any) => u.name === selectedUnitName)
    const videos = selectedUnit ? selectedUnit.videos || [] : []

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage platform content and configurations.</p>
                        <span>Secure Mode Active</span>
                    </div>
                </div>

                {/* --- NAVIGATION TABS START --- */}
                <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="relative flex md:grid md:grid-cols-3 gap-1 p-1 bg-gray-200/50 dark:bg-white/5 rounded-xl w-full">
                        <TabButton
                            active={activeTab === 'pending'}
                            onClick={() => {
                                if (activeTab !== 'pending') {
                                    setIsLoading(true)
                                    setActiveTab('pending')
                                }
                            }}
                            icon={<Clock size={16} />}
                            label="Approvals"
                            count={pendingResources.length}
                        />
                        <TabButton
                            active={activeTab === 'users'}
                            onClick={() => {
                                if (activeTab !== 'users') {
                                    setIsLoading(true)
                                    setActiveTab('users')
                                }
                            }}
                            icon={<User size={16} />}
                            label="Users"
                        />
                        <TabButton
                            active={activeTab === 'structure'}
                            onClick={() => {
                                if (activeTab !== 'structure') {
                                    setIsLoading(true)
                                    setActiveTab('structure')
                                }
                            }}
                            icon={<Settings size={16} />}
                            label="Structure"
                        />
                    </div>
                </div>
                {/* --- NAVIGATION TABS END --- */}

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <TyreLoader size={40} />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'pending' && <motion.div key="pending" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}><PendingView resources={pendingResources} processingId={processingId} onAction={handleResourceAction} /></motion.div>}
                            {activeTab === 'users' && <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}><UsersView users={users} processingId={processingId} onAction={handleUserAction} /></motion.div>}
                            {activeTab === 'structure' && <motion.div key="structure" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                                <div className="grid grid-cols-1 md:flex md:gap-6 md:overflow-x-auto md:pb-8 gap-6">
                                    <StructureCard title="Programs" step="01" items={programs.map(p => ({ id: p.id, name: p.name, original: p }))} value={newProgram} setValue={setNewProgram} onAdd={() => handleStructureAdd('program', newProgram)} onRemove={(id: string) => handleStructureRemove('program', id)} activeId={selectedProgramId} onSelect={setSelectedProgramId} isLoading={isSubmitting} removingId={removingId} onReorder={(newOrder: any[]) => handleReorder('program', newOrder.map(i => i.original))} />
                                    <StructureCard title="Years" step="02" items={years.map(y => ({ id: y.id, name: y.name, original: y }))} value={newYear} setValue={setNewYear} onAdd={() => handleStructureAdd('year', newYear)} onRemove={(id: string) => handleStructureRemove('year', id)} activeId={selectedYearId} onSelect={setSelectedYearId} disabled={!selectedProgramId} parentName={selectedProgram?.name} isLoading={isSubmitting} removingId={removingId} onReorder={(newOrder: any[]) => handleReorder('year', newOrder.map(i => i.original))} />
                                    <StructureCard title="Branches" step="03" items={courses.map(c => ({ id: c.id, name: c.name, original: c }))} value={newBranch} setValue={setNewBranch} onAdd={() => handleStructureAdd('course', newBranch)} onRemove={(id: string) => handleStructureRemove('course', id)} activeId={selectedCourseId} onSelect={setSelectedCourseId} disabled={!selectedYearId} parentName={selectedYear?.name} isLoading={isSubmitting} removingId={removingId} onReorder={(newOrder: any[]) => handleReorder('course', newOrder.map(i => i.original))} />
                                    <StructureCard title="Semesters" step="04" items={semesters.map(s => ({ id: s.id, name: s.name, original: s }))} value={newSemester} setValue={handleSemesterChange} onAdd={() => handleStructureAdd('semester', newSemester)} onRemove={(id: string) => handleStructureRemove('semester', id)} activeId={selectedSemesterId} onSelect={setSelectedSemesterId} disabled={!selectedCourseId} parentName={selectedCourse?.name} isLoading={isSubmitting} removingId={removingId} onReorder={(newOrder: any[]) => handleReorder('semester', newOrder.map(i => i.original))} />
                                    <StructureCard title="Subjects" step="05" items={subjects.map(s => ({ id: typeof s === 'string' ? s : s.name, name: typeof s === 'string' ? s : s.name, original: s }))} value={newSubject} setValue={setNewSubject} onAdd={() => handleStructureAdd('subject', newSubject)} onRemove={(id: string) => handleStructureRemove('subject', id)} activeId={selectedSubjectName} onSelect={setSelectedSubjectName} disabled={!selectedSemesterId} parentName={selectedSemester?.name} isLoading={isSubmitting} removingId={removingId} onReorder={(newOrder: any[]) => handleReorder('subject', newOrder.map(i => i.original))} />
                                    <StructureCard title="Units" step="06" items={units.map((u: any) => ({ id: u.name, name: u.name, original: u }))} value={newUnit} setValue={handleUnitChange} onAdd={() => handleStructureAdd('unit', newUnit)} onRemove={(id: string) => handleStructureRemove('unit', id)} activeId={selectedUnitName} onSelect={setSelectedUnitName} disabled={!selectedSubjectName} parentName={selectedSubjectName} isLoading={isSubmitting} removingId={removingId} onReorder={(newOrder: any[]) => handleReorder('unit', newOrder.map(i => i.original))} />
                                    <StructureCard title="Videos" step="07" items={videos.map((v: any) => ({ id: v.id, name: v.title, original: v }))} value={newVideoTitle} setValue={setNewVideoTitle} extraInput={{ value: newVideoUrl, setValue: setNewVideoUrl, placeholder: "YouTube URL..." }} onAdd={() => handleStructureAdd('video', newVideoTitle)} onRemove={(id: string) => handleStructureRemove('video', id)} disabled={!selectedUnitName} parentName={selectedUnitName} isLoading={isSubmitting} removingId={removingId} onReorder={(newOrder: any[]) => handleReorder('video', newOrder.map(i => i.original))} />
                                </div>
                            </motion.div>}
                        </>
                    )}
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
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${styles[type]}`}>{label}</span>
}

function TabButton({ active, onClick, icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`relative flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all w-full ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5'}`}
        >
            {active && (
                <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800 shadow-sm z-0"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-2">
                {icon}
                <span className="hidden sm:inline">{label}</span>
            </span>
            {count > 0 && (
                <span className="relative z-10 -ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow-sm ring-2 ring-white dark:ring-gray-900 sm:ml-0 sm:-mt-2">
                    {count}
                </span>
            )}
        </button>
    )
}

function StructureCard({ title, step, items, value, setValue, extraInput, onAdd, onRemove, activeId, onSelect, disabled, parentName, isLoading, removingId, onReorder }: any) {
    // If onReorder is provided, use Reorder.Group
    // We need local state for immediate feedback if we want smooth drag, but items prop usually comes from parent state.
    // Framer motion Reorder works best when controlling the state directly.
    // However, since 'items' is derived in parent, we might need an intermediate state or just pass onReorder to update parent.
    // Standard pattern: Reorder.Group values={items} onReorder={onReorder}

    const content = items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Layers size={24} className="mb-2 opacity-20" />
            <p className="text-xs">No items yet</p>
        </div>
    ) : (
        onReorder ? (
            <Reorder.Group axis="y" values={items} onReorder={onReorder} className="space-y-1">
                <AnimatePresence initial={false}>
                    {items.map((item: any) => (
                        <Reorder.Item
                            key={item.id}
                            value={item}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`group flex items-center justify-between p-2 rounded-lg cursor-grab active:cursor-grabbing text-sm transition-colors ${activeId === item.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                            onClick={() => !disabled && onSelect && onSelect(item.id)}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <GripVertical size={12} className={`opacity-0 group-hover:opacity-100 ${activeId === item.id ? 'text-gray-400' : 'text-gray-400'}`} />
                                <span className="truncate flex-1">{item.name}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
                                className={`p-1 rounded transition-opacity ${removingId === item.id
                                    ? 'opacity-100'
                                    : `opacity-0 group-hover:opacity-100 ${activeId === item.id ? 'hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-red-100 text-red-500'}`
                                    }`}
                                disabled={!!removingId}
                            >
                                {removingId === item.id ? (
                                    <div className="animate-spin">
                                        <TyreLoader size={14} />
                                    </div>
                                ) : (
                                    <Trash2 size={14} />
                                )}
                            </button>
                        </Reorder.Item>
                    ))}
                </AnimatePresence>
            </Reorder.Group>
        ) : (
            <div className="space-y-1">
                <AnimatePresence initial={false}>
                    {items.map((item: any) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors ${activeId === item.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                            onClick={() => !disabled && onSelect && onSelect(item.id)}
                        >
                            <span className="truncate flex-1">{item.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
                                className={`p-1 rounded transition-opacity ${removingId === item.id
                                    ? 'opacity-100'
                                    : `opacity-0 group-hover:opacity-100 ${activeId === item.id ? 'hover:bg-gray-800 dark:hover:bg-gray-200' : 'hover:bg-red-100 text-red-500'}`
                                    }`}
                                disabled={!!removingId}
                            >
                                {removingId === item.id ? (
                                    <div className="animate-spin">
                                        <TyreLoader size={14} />
                                    </div>
                                ) : (
                                    <Trash2 size={14} />
                                )}
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )
    );

    return (
        <div className={`flex flex-col h-[400px] w-full min-w-[280px] rounded-xl border bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 ${disabled ? 'border-gray-100 opacity-50 dark:border-gray-800' : 'border-gray-200 dark:border-gray-800 ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700'}`}>
            <div className="flex-none p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step {step}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${disabled ? 'bg-gray-300 dark:bg-gray-700' : 'bg-green-500'}`}></span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-xs text-gray-500 h-4 truncate">{disabled ? 'Select previous step' : parentName ? `in ${parentName}` : 'Root level'}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {content}
            </div>
            <div className="flex-none p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                {extraInput && <input type="text" value={extraInput.value} onChange={(e) => extraInput.setValue(e.target.value)} disabled={disabled} placeholder={extraInput.placeholder} className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed" />}
                <div className="flex gap-2">
                    <input type="text" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !disabled && onAdd()} disabled={disabled} placeholder={`Add ${title}...`} className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800 border-0 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed" />
                    <button onClick={onAdd} disabled={disabled || !value.trim() || isLoading} className="flex-none p-2 rounded-md bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-9 flex items-center justify-center">
                        {isLoading ? <div className="animate-spin"><TyreLoader size={16} /></div> : <Plus size={16} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

function PendingView({ resources, processingId, onAction }: any) {
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)

    const NeutralAvatar = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="24" height="24" className="fill-gray-100 dark:fill-gray-800" />
            <circle cx="12" cy="8" r="4" className="fill-gray-300 dark:fill-gray-600" />
            <path d="M4 20C4 16 8 15 12 15C16 15 20 16 20 20" strokeWidth="0" className="fill-gray-300 dark:fill-gray-600" />
        </svg>
    )

    if (resources.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <Check size={48} className="mb-4 opacity-20" />
                <p>No pending approvals</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {resources.map((resource: PendingResource) => {
                const isExpanded = expandedRequestId === resource._id
                const isProcessing = processingId === resource._id

                return (
                    <motion.div
                        key={resource._id}
                        initial={false}
                        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                        {/* Collapsed Card Header */}
                        <button
                            onClick={() => setExpandedRequestId(isExpanded ? null : resource._id)}
                            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            {/* Avatar */}
                            <div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                {resource.uploaderAvatar ? (
                                    <img src={resource.uploaderAvatar} alt={resource.uploaderName} className="h-full w-full object-cover" />
                                ) : (
                                    <NeutralAvatar className="h-full w-full" />
                                )}
                            </div>

                            {/* Request Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{resource.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{resource.uploaderName}</div>
                            </div>

                            {/* Request ID Badge */}
                            <div className="flex-shrink-0">
                                <StatusBadge type="warning" label="Request" />
                            </div>

                            {/* Expand Icon */}
                            <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex-shrink-0"
                            >
                                <ChevronRight className="text-gray-400" size={18} />
                            </motion.div>
                        </button>

                        {/* Expanded Content */}
                        <motion.div
                            initial={false}
                            animate={{
                                height: isExpanded ? 'auto' : 0,
                                opacity: isExpanded ? 1 : 0
                            }}
                            transition={{
                                height: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
                                opacity: { duration: 0.2, delay: isExpanded ? 0.1 : 0 }
                            }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                {/* Uploader Info */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        Uploaded By
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                            {resource.uploaderAvatar ? (
                                                <img src={resource.uploaderAvatar} alt={resource.uploaderName} className="h-full w-full object-cover" />
                                            ) : (
                                                <NeutralAvatar className="h-full w-full" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{resource.uploaderName || 'Unknown User'}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                {new Date(resource.createdAt).toLocaleDateString()} • {new Date(resource.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Details */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        Details
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-xs text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Subject:</span> {resource.subject}
                                        </div>
                                        <div className="text-xs text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Class:</span> {resource.year} Year - {resource.branch}
                                        </div>
                                        {resource.unit && (
                                            <div className="text-xs text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">Unit:</span> {resource.unit}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Type:</span> {resource.type || 'Not specified'}
                                        </div>
                                        {resource.description && (
                                            <div className="text-xs text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">Description:</span> {resource.description}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        Actions
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {/* Review */}
                                        <a
                                            href={resource.driveLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                        >
                                            <ExternalLink size={14} />
                                            <span className="hidden sm:inline">Review</span>
                                        </a>

                                        {/* Approve */}
                                        <button
                                            onClick={() => onAction(resource._id, 'approve')}
                                            disabled={isProcessing}
                                            className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                        >
                                            {isProcessing ? <TyreLoader size={14} /> : <Check size={14} />}
                                            <span className="hidden sm:inline">Approve</span>
                                        </button>

                                        {/* Reject */}
                                        <button
                                            onClick={() => onAction(resource._id, 'reject')}
                                            disabled={isProcessing}
                                            className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                        >
                                            <X size={14} />
                                            <span className="hidden sm:inline">Reject</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )
            })}
        </div>
    )
}

function UsersView({ users, processingId, onAction }: any) {
    const [selectedRole, setSelectedRole] = useState<{ [key: string]: string }>({})
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const NeutralAvatar = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="24" height="24" className="fill-gray-100 dark:fill-gray-800" />
            <circle cx="12" cy="8" r="4" className="fill-gray-300 dark:fill-gray-600" />
            <path d="M4 20C4 16 8 15 12 15C16 15 20 16 20 20" strokeWidth="0" className="fill-gray-300 dark:fill-gray-600" />
        </svg>
    )

    const filteredUsers = users.filter((user: UserData) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
            </div>

            <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        No users found matching "{searchQuery}"
                    </div>
                ) : (
                    filteredUsers.map((user: UserData) => {
                        const isExpanded = expandedUserId === user._id
                        const isProcessing = processingId === user._id

                        return (
                            <motion.div
                                key={user._id}
                                initial={false}
                                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                            >
                                {/* Collapsed Card Header */}
                                <button
                                    onClick={() => setExpandedUserId(isExpanded ? null : user._id)}
                                    className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                                >
                                    {/* Avatar */}
                                    <div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        {user.avatar && user.avatar !== 'avatar1' ? (
                                            <img src={user.avatar} className="h-full w-full object-cover" alt="" />
                                        ) : (
                                            <NeutralAvatar className="h-full w-full" />
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                                    </div>

                                    {/* Role Badge */}
                                    <div className="flex-shrink-0">
                                        <StatusBadge type={user.role === 'admin' ? 'admin' : 'success'} label={user.role} />
                                    </div>

                                    {/* Expand Icon */}
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-shrink-0"
                                    >
                                        <ChevronRight className="text-gray-400" size={18} />
                                    </motion.div>
                                </button>

                                {/* Expanded Content */}
                                <motion.div
                                    initial={false}
                                    animate={{
                                        height: isExpanded ? 'auto' : 0,
                                        opacity: isExpanded ? 1 : 0
                                    }}
                                    transition={{
                                        height: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
                                        opacity: { duration: 0.2, delay: isExpanded ? 0.1 : 0 }
                                    }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                        {/* Status Section */}
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                Current Status
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {user.isBanned && <StatusBadge type="danger" label="Banned" />}
                                                {(user.isRestricted || !user.canUpload) && <StatusBadge type="warning" label="Restricted" />}
                                                {user.isTrusted && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                                        Trusted User
                                                    </span>
                                                )}
                                                {!user.isBanned && !user.isRestricted && user.canUpload && !user.isTrusted && (
                                                    <span className="px-3 py-1 rounded-lg text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Section - Only for non-admins */}
                                        {user.role !== 'admin' && (
                                            <>
                                                {/* Assign Role */}
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                        Assign Role
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 outline-none focus:border-blue-500 transition-colors"
                                                            value={selectedRole[user._id] || ''}
                                                            onChange={(e) => setSelectedRole({ ...selectedRole, [user._id]: e.target.value })}
                                                            disabled={isProcessing}
                                                        >
                                                            <option value="">Select a role...</option>
                                                            <option value="semi-admin">Semi Admin</option>
                                                            <option value="content-reviewer">Content Reviewer</option>
                                                            <option value="structure-manager">Structure Manager</option>
                                                            <option value="user">User</option>
                                                        </select>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedRole[user._id]) {
                                                                    onAction(user._id, 'assign-role', selectedRole[user._id])
                                                                    setSelectedRole({ ...selectedRole, [user._id]: '' })
                                                                }
                                                            }}
                                                            disabled={!selectedRole[user._id] || isProcessing}
                                                            className="px-2.5 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                                                            <Check size={14} />
                                                            <span className="hidden sm:inline">Apply</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* User Management Actions */}
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                        User Management
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {/* Ban/Unban */}
                                                        <button
                                                            onClick={() => onAction(user._id, user.isBanned ? 'unban' : 'ban')}
                                                            disabled={isProcessing}
                                                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${user.isBanned
                                                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                                }`}>
                                                            <Ban size={14} />
                                                            <span className="hidden sm:inline">{user.isBanned ? 'Unban' : 'Ban'}</span>
                                                        </button>

                                                        {/* Restrict/Unrestrict */}
                                                        <button
                                                            onClick={() => onAction(user._id, (user.isRestricted || !user.canUpload) ? 'unrestrict' : 'restrict')}
                                                            disabled={isProcessing}
                                                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${user.isRestricted || !user.canUpload
                                                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                                                : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                                                                }`}
                                                        >
                                                            <AlertCircle size={14} />
                                                            <span className="hidden sm:inline">{user.isRestricted || !user.canUpload ? 'Unrestrict' : 'Restrict'}</span>
                                                        </button>

                                                        {/* Trust/Untrust */}
                                                        <button
                                                            onClick={() => onAction(user._id, user.isTrusted ? 'untrust' : 'trust')}
                                                            disabled={isProcessing}
                                                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${user.isTrusted
                                                                ? 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                                                }`}
                                                        >
                                                            <Shield size={14} />
                                                            <span className="hidden sm:inline">{user.isTrusted ? 'Untrust' : 'Trust'}</span>
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => onAction(user._id, 'delete')}
                                                            disabled={isProcessing}
                                                            className="px-2 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                                        >
                                                            <Trash2 size={14} />
                                                            <span className="hidden sm:inline">Delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Processing Indicator */}
                                        {isProcessing && (
                                            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 py-1">
                                                <TyreLoader size={14} />
                                                Processing...
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </div>
    )
}