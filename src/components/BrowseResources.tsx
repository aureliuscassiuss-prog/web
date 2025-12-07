/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef } from 'react';
import {
    ChevronLeft, BookOpen, GraduationCap,
    ArrowRight, Layers, Library,
    FilterX, ChevronRight, Hash, Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ResourceGrid from './ResourceGrid';
import TyreLoader from './TyreLoader';

interface BrowseResourcesProps {
    onUploadRequest?: (data: any) => void;
}

export default function BrowseResources({ onUploadRequest }: BrowseResourcesProps) {
    // --- State with localStorage persistence ---
    const [step, setStep] = useState(() => {
        const saved = localStorage.getItem('browseResourcesStep');
        return saved ? parseInt(saved, 10) : 1;
    });

    const [selections, setSelections] = useState<{ program?: string; year?: string; semester?: string; course?: string; subject?: string; unit?: string }>(() => {
        const saved = localStorage.getItem('browseResourcesSelections');
        return saved ? JSON.parse(saved) : {};
    });

    const [loadingText, setLoadingText] = useState('Initializing...');
    const [structure, setStructure] = useState<any>(null);
    const [isLoadingStructure, setIsLoadingStructure] = useState(true);

    // --- Auto-select based on User Profile ---
    const { user } = useAuth();
    const autoSelectedRef = useRef(false);

    useEffect(() => {
        if (!autoSelectedRef.current && user && structure && !selections.program) {
            const program = structure.programs.find((p: any) => p.id === user.course);
            if (program) {
                const year = program.years.find((y: any) => y.id === user.year?.toString());
                if (year) {
                    // Try to auto-select branch/course if available in user profile
                    // Note: user.branch might store the ID or name, need to check how it's stored.
                    // Assuming user.branch stores ID based on ProfilePage logic.
                    const course = year.courses?.find((c: any) => c.id === user.branch);

                    if (course) {
                        const semester = course.semesters?.find((s: any) => s.id === user.semester?.toString());
                        if (semester) {
                            setSelections({
                                program: program.id,
                                year: year.id,
                                course: course.id,
                                semester: semester.id
                            });
                            setStep(5); // Jump to Subject selection
                            autoSelectedRef.current = true;
                        } else {
                            setSelections({
                                program: program.id,
                                year: year.id,
                                course: course.id
                            });
                            setStep(4); // Jump to Semester selection
                            autoSelectedRef.current = true;
                        }
                    } else {
                        setSelections({
                            program: program.id,
                            year: year.id
                        });
                        setStep(3); // Jump to Branch selection
                        autoSelectedRef.current = true;
                    }
                }
            }
        }
    }, [user, structure, selections.program]);

    // --- Persist state to localStorage ---
    useEffect(() => {
        localStorage.setItem('browseResourcesStep', step.toString());
    }, [step]);

    useEffect(() => {
        localStorage.setItem('browseResourcesSelections', JSON.stringify(selections));
    }, [selections]);

    // --- Data Fetching ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch('/api/admin?action=structure');
                const data = await res.json();
                setStructure(data);
            } catch (err) {
                console.error('Failed to fetch structure', err);
            } finally {
                setIsLoadingStructure(false);
            }
        };
        loadData();
    }, []);

    // --- Loading Animation Logic ---
    useEffect(() => {
        if (step === 7) {
            const texts = ["Analyzing curriculum...", "Fetching resources...", "Personalizing results..."];
            let i = 0;
            const textInterval = setInterval(() => {
                setLoadingText(texts[i]);
                i = (i + 1) % texts.length;
            }, 800);

            const finishTimeout = setTimeout(() => {
                clearInterval(textInterval);
                setStep(8);
            }, 2000);

            return () => {
                clearInterval(textInterval);
                clearTimeout(finishTimeout);
            };
        }
    }, [step]);

    // --- Memoized Data Helpers ---
    const programs = useMemo(() => structure?.programs || [], [structure]);

    const currentProgram = useMemo(() => programs.find((p: any) => p.id === selections.program), [selections.program, programs]);
    const years = useMemo(() => currentProgram?.years || [], [currentProgram]);

    const currentYear = useMemo(() => years.find((y: any) => y.id === selections.year), [selections.year, years]);
    const courses = useMemo(() => currentYear?.courses || [], [currentYear]);

    const currentCourse = useMemo(() => courses.find((c: any) => c.id === selections.course), [selections.course, courses]);
    const semesters = useMemo(() => currentCourse?.semesters || [], [currentCourse]);

    const currentSemester = useMemo(() => semesters.find((s: any) => s.id === selections.semester), [selections.semester, semesters]);
    const subjects = useMemo(() => currentSemester?.subjects || [], [currentSemester]);

    const units = useMemo(() => {
        if (!selections.subject || !currentSemester) return []; // Updated dependency
        const subjectObj = subjects.find((s: any) => // Updated source
            (typeof s === 'string' ? s : s.name) === selections.subject
        );
        return (subjectObj && typeof subjectObj === 'object' && subjectObj.units) ? subjectObj.units : [];
    }, [selections.subject, subjects]); // Updated dependency

    // --- Handlers ---
    const handleSelect = (key: keyof typeof selections, value: string, nextStep: number) => {
        setSelections(prev => ({ ...prev, [key]: value }));
        setStep(nextStep);
    };

    const handleSubjectSelect = (subject: any) => {
        const subjectName = typeof subject === 'string' ? subject : subject.name;
        setSelections(prev => ({ ...prev, subject: subjectName }));

        // Check if subject has units to decide next step
        if (typeof subject === 'object' && subject.units && subject.units.length > 0) {
            setStep(6);
        } else {
            setStep(7);
        }
    };

    const handleReset = () => {
        setSelections({});
        setStep(1);
        localStorage.removeItem('browseResourcesStep');
        localStorage.removeItem('browseResourcesSelections');
    };

    // Breadcrumb click handlers - clear subsequent selections
    const handleBreadcrumbClick = (targetStep: number) => {
        setStep(targetStep);

        // Clear selections that come after the target step
        if (targetStep === 1) {
            setSelections({}); // Clear all
        } else if (targetStep === 2) {
            setSelections(prev => ({ program: prev.program })); // Keep only program
        } else if (targetStep === 3) {
            setSelections(prev => ({ program: prev.program, year: prev.year })); // Keep program and year
        } else if (targetStep === 4) {
            setSelections(prev => ({ program: prev.program, year: prev.year, course: prev.course })); // Keep program, year, course
        } else if (targetStep === 6) {
            setSelections(prev => ({ program: prev.program, year: prev.year, course: prev.course, semester: prev.semester, subject: prev.subject })); // Keep all except unit
        }
    };

    // --- Render Helpers ---
    const totalSteps = 6;
    const progress = Math.min(((step - 1) / totalSteps) * 100, 100);

    if (isLoadingStructure) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-gray-500">
                <TyreLoader size={50} />
                <p className="text-sm font-medium animate-pulse">Loading academic data...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto min-h-[60vh] p-4 md:p-8">

            {/* Header Area */}
            {step < 8 && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-6">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)}
                                className="group flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                                <div className="p-1 rounded-full bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700 transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                </div>
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        ) : <div />}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Step {step}/{totalSteps}</span>
                    </div>

                    <div className="text-center space-y-2 mb-8">
                        <StepHeading step={step} />
                    </div>

                    {/* Styled Progress Bar */}
                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-black dark:bg-white transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-col items-center w-full">

                {/* STEP 1: Program */}
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {programs.map((prog: any) => (
                            <SelectionCard
                                key={prog.id}
                                onClick={() => handleSelect('program', prog.id, 2)}
                                title={prog.name}
                                subtitle="Degree Program"
                                icon={<Library className="h-6 w-6" />}
                            />
                        ))}
                    </div>
                )}

                {/* STEP 2: Year */}
                {step === 2 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {years.map((year: any) => (
                            <SelectionCard
                                key={year.id}
                                onClick={() => handleSelect('year', year.id, 3)}
                                title={year.name}
                                subtitle="Academic Year"
                                icon={<GraduationCap className="h-6 w-6" />}
                                centered
                            />
                        ))}
                    </div>
                )}

                {/* STEP 3: Course/Branch */}
                {step === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {courses.map((c: any) => (
                            <SelectionCard
                                key={c.id}
                                onClick={() => handleSelect('course', c.id, 4)}
                                title={c.name}
                                subtitle={`${c.semesters?.length || 0} Semesters`}
                                icon={<Layers className="h-6 w-6" />}
                            />
                        ))}
                    </div>
                )}

                {/* STEP 4: Semester */}
                {step === 4 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {semesters.map((sem: any) => (
                            <SelectionCard
                                key={sem.id}
                                onClick={() => handleSelect('semester', sem.id, 5)}
                                title={sem.name}
                                subtitle="Semester"
                                icon={<Calendar className="h-6 w-6" />}
                                centered
                            />
                        ))}
                    </div>
                )}

                {/* STEP 5: Subjects */}
                {step === 5 && (
                    <div className="w-full space-y-2 animate-in slide-in-from-right-8 duration-300">
                        {subjects.map((sub: any) => (
                            <ListItem
                                key={typeof sub === 'string' ? sub : sub.name}
                                onClick={() => handleSubjectSelect(sub)}
                                title={typeof sub === 'string' ? sub : sub.name}
                                icon={<BookOpen className="h-4 w-4" />}
                            />
                        ))}
                    </div>
                )}

                {/* STEP 6: Units */}
                {step === 6 && (
                    <div className="w-full space-y-4 animate-in slide-in-from-right-8 duration-300">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs text-gray-500 font-medium">Narrow down your search (Optional)</span>
                            <button onClick={() => setStep(7)} className="text-xs font-medium text-black dark:text-white underline decoration-gray-300 hover:decoration-black transition-all">
                                Skip Selection
                            </button>
                        </div>
                        <div className="space-y-2">
                            {units.map((unit: any) => {
                                const unitName = typeof unit === 'string' ? unit : unit.name;
                                return (
                                    <ListItem
                                        key={unitName}
                                        onClick={() => handleSelect('unit', unitName, 7)}
                                        title={unitName}
                                        icon={<Hash className="h-4 w-4" />}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 7: Loading */}
                {step === 7 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                        <div className="relative mb-8 flex justify-center">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                            <TyreLoader size={80} className="relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{loadingText}</h3>
                        <p className="text-sm text-gray-500">Curating the best study materials for you.</p>
                    </div>
                )}

                {/* STEP 8: Results */}
                {step === 8 && (
                    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {/* Results Header */}
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Filtered Results</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                        {selections.subject}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        <BreadcrumbBadge label={currentProgram?.name} onClick={() => handleBreadcrumbClick(1)} />
                                        <BreadcrumbBadge label={currentYear?.name} onClick={() => handleBreadcrumbClick(2)} />
                                        <BreadcrumbBadge label={currentCourse?.name} onClick={() => handleBreadcrumbClick(3)} />
                                        <BreadcrumbBadge label={currentSemester?.name} onClick={() => handleBreadcrumbClick(4)} />
                                        {selections.unit && <BreadcrumbBadge label={selections.unit} active onClick={() => handleBreadcrumbClick(6)} />}
                                    </div>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                >
                                    <FilterX className="h-4 w-4" />
                                    Change Filters
                                </button>
                            </div>
                        </div>

                        {/* Grid Component */}
                        <ResourceGrid
                            view="resources"
                            filters={{
                                branch: selections.course, // Maps to API requirement
                                year: selections.year, // Maps to API requirement
                                semester: selections.semester,
                                subject: selections.subject,
                                course: selections.program, // Maps to API requirement
                                unit: selections.unit
                            }}
                            searchQuery=""
                            onUploadRequest={onUploadRequest}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Sub Components for cleaner styling ---

function StepHeading({ step }: { step: number }) {
    const headings = {
        1: { title: "Select Program", sub: "What are you studying?" },
        2: { title: "Academic Year", sub: "Which year are you in?" },
        3: { title: "Choose Branch", sub: "Select your specialization" },
        4: { title: "Select Semester", sub: "Which semester is it?" },
        5: { title: "Pick Subject", sub: "What subject do you need help with?" },
        6: { title: "Select Unit", sub: "Looking for a specific topic?" },
    };

    const current = headings[step as keyof typeof headings] || { title: "", sub: "" };

    return (
        <>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {current.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {current.sub}
            </p>
        </>
    );
}

function SelectionCard({ onClick, title, subtitle, icon, centered }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                group relative overflow-hidden bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800
                hover:border-black dark:hover:border-white hover:shadow-md transition-all duration-200 text-left w-full
                ${centered ? 'flex flex-col items-center text-center' : 'flex items-center'}
            `}
        >
            <div className={`
                shrink-0 rounded-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white
                flex items-center justify-center transition-colors group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black
                ${centered ? 'h-12 w-12 mb-4' : 'h-12 w-12 mr-4'}
            `}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                    {title}
                </h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
            {!centered && (
                <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            )}
        </button>
    )
}

function ListItem({ onClick, title, icon }: any) {
    return (
        <button
            onClick={onClick}
            className="group flex w-full items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-black dark:hover:border-white transition-all duration-200"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0 p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {icon}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors" />
        </button>
    )
}

function BreadcrumbBadge({ label, active, onClick }: { label?: string, active?: boolean, onClick?: () => void }) {
    if (!label) return null;

    const Component = onClick ? 'button' : 'span';

    return (
        <Component
            onClick={onClick}
            className={`
            px-2.5 py-1 rounded-md text-xs font-medium border transition-all
            ${active
                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                    : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}
            ${onClick ? 'hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white cursor-pointer' : ''}
        `}>
            {label}
        </Component>
    )
}