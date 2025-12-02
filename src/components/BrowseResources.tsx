import { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft, BookOpen, CheckCircle2, GraduationCap,
    Search, ArrowRight, Loader2, Layers, Library,
    FilterX, ChevronRight, Hash
} from 'lucide-react';
import ResourceGrid from './ResourceGrid';

interface BrowseResourcesProps {
    onUploadRequest?: (data: any) => void;
}

export default function BrowseResources({ onUploadRequest }: BrowseResourcesProps) {
    // --- State ---
    const [step, setStep] = useState(1);
    const [selections, setSelections] = useState<{ program?: string; year?: string; course?: string; subject?: string; unit?: string }>({});
    const [loadingText, setLoadingText] = useState('Initializing...');
    const [structure, setStructure] = useState<any>(null);
    const [isLoadingStructure, setIsLoadingStructure] = useState(true);

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
        if (step === 6) {
            const texts = ["Analyzing curriculum...", "Fetching resources...", "Personalizing results..."];
            let i = 0;
            const textInterval = setInterval(() => {
                setLoadingText(texts[i]);
                i = (i + 1) % texts.length;
            }, 800);

            const finishTimeout = setTimeout(() => {
                clearInterval(textInterval);
                setStep(7);
            }, 2000);

            return () => {
                clearInterval(textInterval);
                clearTimeout(finishTimeout);
            };
        }
    }, [step]);

    // --- Memoized Data Helpers ---
    const programs = structure?.programs || [];

    const currentProgram = useMemo(() => programs.find((p: any) => p.id === selections.program), [selections.program, programs]);
    const years = useMemo(() => currentProgram?.years || [], [currentProgram]);

    const currentYear = useMemo(() => years.find((y: any) => y.id === selections.year), [selections.year, years]);
    const courses = useMemo(() => currentYear?.courses || [], [currentYear]);

    const currentCourse = useMemo(() => courses.find((c: any) => c.id === selections.course), [selections.course, courses]);
    const subjects = useMemo(() => currentCourse?.subjects || [], [currentCourse]);

    const units = useMemo(() => {
        if (!selections.subject || !currentCourse) return [];
        const subjectObj = currentCourse.subjects.find((s: any) =>
            (typeof s === 'string' ? s : s.name) === selections.subject
        );
        return (subjectObj && typeof subjectObj === 'object' && subjectObj.units) ? subjectObj.units : [];
    }, [selections.subject, currentCourse]);

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
            setStep(5);
        } else {
            setStep(6);
        }
    };

    const handleReset = () => {
        setSelections({});
        setStep(1);
    };

    // --- Render Helpers ---
    const totalSteps = 5;
    const progress = Math.min(((step - 1) / totalSteps) * 100, 100);

    if (isLoadingStructure) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
                <p className="text-sm font-medium animate-pulse">Loading academic data...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto min-h-[60vh] p-4 md:p-8">

            {/* Header Area */}
            {step < 7 && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-6">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)}
                                className="group flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                                <div className="p-1 rounded-full bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700 transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                </div>
                                <span>Back</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-in zoom-in-95 duration-300">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full animate-in zoom-in-95 duration-300">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-in zoom-in-95 duration-300">
                        {courses.map((c: any) => (
                            <SelectionCard
                                key={c.id}
                                onClick={() => handleSelect('course', c.id, 4)}
                                title={c.name}
                                subtitle={`${c.subjects?.length || 0} Subjects Available`}
                                icon={<Layers className="h-6 w-6" />}
                            />
                        ))}
                    </div>
                )}

                {/* STEP 4: Subjects */}
                {step === 4 && (
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

                {/* STEP 5: Units */}
                {step === 5 && (
                    <div className="w-full space-y-4 animate-in slide-in-from-right-8 duration-300">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs text-gray-500 font-medium">Narrow down your search (Optional)</span>
                            <button onClick={() => setStep(6)} className="text-xs font-medium text-black dark:text-white underline decoration-gray-300 hover:decoration-black transition-all">
                                Skip Selection
                            </button>
                        </div>
                        <div className="space-y-2">
                            {units.map((unit: any) => {
                                const unitName = typeof unit === 'string' ? unit : unit.name;
                                return (
                                    <ListItem
                                        key={unitName}
                                        onClick={() => handleSelect('unit', unitName, 6)}
                                        title={unitName}
                                        icon={<Hash className="h-4 w-4" />}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 6: Loading */}
                {step === 6 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                            <Loader2 className="h-12 w-12 animate-spin text-black dark:text-white relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{loadingText}</h3>
                        <p className="text-sm text-gray-500">Curating the best study materials for you.</p>
                    </div>
                )}

                {/* STEP 7: Results */}
                {step === 7 && (
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
                                        <BreadcrumbBadge label={currentProgram?.name} />
                                        <BreadcrumbBadge label={currentYear?.name} />
                                        <BreadcrumbBadge label={currentCourse?.name} />
                                        {selections.unit && <BreadcrumbBadge label={selections.unit} active />}
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
                                year: parseInt(selections.year || '0'), // Maps to API requirement
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
        4: { title: "Pick Subject", sub: "What subject do you need help with?" },
        5: { title: "Select Unit", sub: "Looking for a specific topic?" },
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

function BreadcrumbBadge({ label, active }: { label?: string, active?: boolean }) {
    if (!label) return null;
    return (
        <span className={`
            px-2.5 py-1 rounded-md text-xs font-medium border
            ${active
                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}
        `}>
            {label}
        </span>
    )
}