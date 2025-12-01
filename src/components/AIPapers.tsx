import { useState, useEffect } from 'react'
import {
    FileText,
    Loader2,
    AlertTriangle,
    GraduationCap,
    Calendar,
    Layers,
    BookOpen,
    Check,
    Sparkles,
    ChevronDown,
    Printer,
    Download,
    CheckCircle,
    RotateCcw
} from 'lucide-react'
import jsPDF from 'jspdf'
// @ts-ignore
import autoTable from 'jspdf-autotable'

// --- Types (From Code 2) ---
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
}

export default function AIPapers() {
    // --- State Management (From Code 2) ---
    const [structure, setStructure] = useState<{ programs: Program[] }>({ programs: [] })
    const [loadingStructure, setLoadingStructure] = useState(true)

    // Form State
    const [selectedProgramId, setSelectedProgramId] = useState('')
    const [selectedYearId, setSelectedYearId] = useState('')
    const [selectedCourseId, setSelectedCourseId] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')

    // Generation State
    const [generating, setGenerating] = useState(false)
    const [attemptsLeft, setAttemptsLeft] = useState(3)
    const [generatedPdf, setGeneratedPdf] = useState<{ blob: Blob, filename: string } | null>(null)

    // --- Effects (From Code 2) ---
    useEffect(() => {
        // Fetch structure
        fetch('/api/admin?action=structure')
            .then(res => res.json())
            .then(data => {
                setStructure(data)
                setLoadingStructure(false)
            })
            .catch(err => {
                console.error(err)
                // Fallback for UI demonstration if API fails
                setStructure({ programs: [] })
                setLoadingStructure(false)
            })

        // Check local storage for daily limit
        const today = new Date().toDateString()
        const stored = localStorage.getItem('paper_attempts')
        if (stored) {
            const { date, count } = JSON.parse(stored)
            if (date === today) {
                setAttemptsLeft(count)
            } else {
                localStorage.setItem('paper_attempts', JSON.stringify({ date: today, count: 3 }))
                setAttemptsLeft(3)
            }
        } else {
            localStorage.setItem('paper_attempts', JSON.stringify({ date: today, count: 3 }))
        }
    }, [])

    // --- Derived State ---
    const programs = structure.programs || []
    const selectedProgram = programs.find(p => p.id === selectedProgramId)
    const years = selectedProgram?.years || []
    const selectedYear = years.find(y => y.id === selectedYearId)
    const courses = selectedYear?.courses || []
    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    const subjects = selectedCourse?.subjects || []

    // --- Logic: Handle Generate (From Code 2) ---
    const handleGenerate = async () => {
        if (attemptsLeft <= 0) return
        setGenerating(true)
        setGeneratedPdf(null)

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'generate-paper',
                    program: selectedProgram?.name,
                    year: selectedYear?.name,
                    branch: selectedCourse?.name,
                    subject: selectedSubject
                })
            })

            const data = await res.json()

            // Parse AI response
            let paperData
            try {
                paperData = typeof data.answer === 'string' ? JSON.parse(data.answer) : data.answer
            } catch (e) {
                const match = data.answer.match(/```json\n([\s\S]*)\n```/)
                if (match) {
                    paperData = JSON.parse(match[1])
                } else {
                    throw new Error('Failed to parse AI response')
                }
            }

            const flatData = transformDataForPdf(paperData, selectedSubject, selectedCourse?.name || '', selectedProgram?.name || '')

            generatePDF(flatData)

            // Update limit
            const newCount = attemptsLeft - 1
            setAttemptsLeft(newCount)
            localStorage.setItem('paper_attempts', JSON.stringify({ date: new Date().toDateString(), count: newCount }))

        } catch (error) {
            console.error('Generation failed:', error)
            alert('Failed to generate paper. Please try again.')
        } finally {
            setGenerating(false)
        }
    }

    // --- Logic: Transform Data (From Code 2) ---
    const transformDataForPdf = (aiData: any, subject: string, branch: string, program: string) => {
        const flat: any = {
            EXAM_MONTH: new Date().toLocaleString('default', { month: 'short' }),
            EXAM_YEAR: new Date().getFullYear().toString(),
            COURSE_CODE: aiData.courseCode || 'CS-101',
            SUBJECT_NAME: subject,
            PROGRAMME: program,
            BRANCH: branch,
        }

        // Map MCQs (Section A)
        const sectionA = aiData.sections?.find((s: any) => s.name.includes('Section A'))
        if (sectionA && sectionA.questions) {
            sectionA.questions.forEach((q: any, i: number) => {
                const num = i + 1
                flat[`MCQ_${num}_QUESTION`] = q.text
                if (q.options) {
                    flat[`MCQ_${num}_OPTION_A`] = q.options[0] || ''
                    flat[`MCQ_${num}_OPTION_B`] = q.options[1] || ''
                    flat[`MCQ_${num}_OPTION_C`] = q.options[2] || ''
                    flat[`MCQ_${num}_OPTION_D`] = q.options[3] || ''
                }
            })
        }

        // Map Descriptive (Section B)
        const sectionB = aiData.sections?.find((s: any) => s.name.includes('Section B'))
        if (sectionB && sectionB.questions) {
            const q = sectionB.questions
            // Q2
            flat.Q2_PART_1 = q[0]?.text || ''; flat.Q2_PART_2 = q[1]?.text || ''; flat.Q2_PART_3 = q[2]?.text || ''; flat.Q2_OR_PART = q[3]?.text || ''
            // Q3
            flat.Q3_PART_1 = q[4]?.text || ''; flat.Q3_PART_2 = q[5]?.text || ''; flat.Q3_OR_PART = q[6]?.text || ''
            // Q4
            flat.Q4_PART_1 = q[7]?.text || ''; flat.Q4_PART_2 = q[8]?.text || ''; flat.Q4_OR_PART = q[9]?.text || ''
            // Q5
            flat.Q5_PART_1 = q[10]?.text || ''; flat.Q5_PART_2 = q[11]?.text || ''; flat.Q5_OR_PART = q[12]?.text || ''
            // Q6
            flat.Q6_PART_1 = q[13]?.text || ''; flat.Q6_PART_2 = q[14]?.text || ''; flat.Q6_PART_3 = q[15]?.text || ''
        }
        return flat
    }

    // --- Logic: Generate PDF (From Code 2 - The Complex Layout) ---
    const generatePDF = (data: any) => {
        const doc = new jsPDF("landscape", "mm", "a4");
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // Watermark
        doc.setTextColor(220, 220, 220);
        doc.setFontSize(50);
        doc.setFont("times", "bold");
        doc.text("MediNotes", width / 2, height / 2, { align: "center", angle: 45 });

        // Reset Text
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "italic");
        doc.setFontSize(9);

        // Header
        doc.text("Total No. of Questions: 6", 12, 10);
        doc.text("Total No. of Printed Pages: 2", 135, 10, { align: "right" });

        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.text("Enrollment No.....................................", 135, 16, { align: "right" });

        doc.setFont("times", "normal");
        doc.setFontSize(13);
        doc.text("Faculty of Engineering", 85, 26, { align: "center" });
        doc.text(`End Sem Examination ${data.EXAM_MONTH}-${data.EXAM_YEAR}`, 85, 32, { align: "center" });

        doc.setFontSize(11);
        doc.text(`${data.COURSE_CODE} ${data.SUBJECT_NAME}`, 85, 38, { align: "center" });

        doc.setFont("times", "normal");
        doc.setFontSize(9);
        doc.text(`Programme: ${data.PROGRAMME}`, 40, 43);
        doc.text(`Branch/Specialisation: ${data.BRANCH}`, 135, 43, { align: "right" });

        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.text("Duration: 3 Hrs.", 10, 48);
        doc.text("Maximum Marks: 60", 135, 48, { align: "right" });

        doc.setLineWidth(0.3);
        doc.line(10, 50, 140, 50);

        // Disclaimer
        doc.setTextColor(255, 0, 0);
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        const disclaimer = "DISCLAIMER: This is a mock question paper by MediNotes for practice only. NOT a university paper. Misusing this document may lead to serious disciplinary action.";
        const splitDisclaimer = doc.splitTextToSize(disclaimer, 130);
        doc.text(splitDisclaimer, 10, 54);
        doc.setTextColor(0, 0, 0);

        let yPos = 54 + (3 * splitDisclaimer.length) + 5;

        // Q1 Header
        doc.setFontSize(9);
        doc.text("Q.1", 8, yPos);

        // Render MCQs 1-8
        let savedQ9 = null;

        for (let i = 1; i <= 9; i++) {
            const key = `MCQ_${i}`;
            const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"];

            doc.setFont("times", "normal");
            const qText = data[`${key}_QUESTION`] || "Question text missing";
            const lines = doc.splitTextToSize(qText, 115);

            const optA = `(a) ${data[`${key}_OPTION_A`] || ''}`;
            const optB = `(b) ${data[`${key}_OPTION_B`] || ''}`;
            const optC = `(c) ${data[`${key}_OPTION_C`] || ''}`;
            const optD = `(d) ${data[`${key}_OPTION_D`] || ''}`;

            const hBlock = (4 * lines.length) + 12;

            if (i === 9 && (yPos + hBlock > 200)) {
                savedQ9 = { qText, lines, optA, optB, optC, optD };
                break;
            }

            const roman = romans[i - 1];
            doc.text(`${roman}.`, 14, yPos);
            const indent = (roman === "viii") ? 20 : (roman === "vii" ? 19 : 18);

            doc.text(lines, indent, yPos);
            doc.setFont("times", "bold");
            doc.text("1", 135, yPos);
            doc.setFont("times", "normal");

            yPos += (4 * lines.length);
            doc.text(optA, 18, yPos); doc.text(optB, 75, yPos); yPos += 4.5;
            doc.text(optC, 18, yPos); doc.text(optD, 75, yPos); yPos += 7.5;
        }

        // Second Column
        let yCol2 = 15;
        doc.setFontSize(7);
        doc.text("[2]", 220, 8, { align: "center" });
        doc.setFontSize(9);

        if (savedQ9) {
            doc.setFont("times", "normal");
            doc.text("ix.", 156, yCol2); doc.text(savedQ9.lines, 160, yCol2);
            doc.setFont("times", "bold"); doc.text("1", 285, yCol2); doc.setFont("times", "normal");
            yCol2 += (4 * savedQ9.lines.length);
            doc.text(savedQ9.optA, 160, yCol2); doc.text(savedQ9.optB, 220, yCol2); yCol2 += 4.5;
            doc.text(savedQ9.optC, 160, yCol2); doc.text(savedQ9.optD, 220, yCol2); yCol2 += 11.5;
        }

        // Q10
        const q10Key = "MCQ_10";
        const q10Text = data[`${q10Key}_QUESTION`];
        if (q10Text) {
            const q10Lines = doc.splitTextToSize(q10Text, 120);
            doc.text("x.", 156, yCol2); doc.text(q10Lines, 160, yCol2);
            doc.setFont("times", "bold"); doc.text("1", 285, yCol2); doc.setFont("times", "normal");
            yCol2 += (4 * q10Lines.length);
            doc.text(`(a) ${data[`${q10Key}_OPTION_A`] || ''}`, 160, yCol2); doc.text(`(b) ${data[`${q10Key}_OPTION_B`] || ''}`, 220, yCol2); yCol2 += 4.5;
            doc.text(`(c) ${data[`${q10Key}_OPTION_C`] || ''}`, 160, yCol2); doc.text(`(d) ${data[`${q10Key}_OPTION_D`] || ''}`, 220, yCol2); yCol2 += 10;
        }

        // Q2-Q6 Render Logic (Condensed for brevity, same as Code 2)
        doc.setFont("times", "normal"); doc.text("Q.2", 150, yCol2);
        const q2Parts = [{ l: "i.", t: data.Q2_PART_1, m: "2" }, { l: "ii.", t: data.Q2_PART_2, m: "3" }, { l: "iii.", t: data.Q2_PART_3, m: "5" }];
        q2Parts.forEach(p => { if (!p.t) return; const pl = doc.splitTextToSize(p.t, 120); doc.text(p.l, 156, yCol2); doc.text(pl, 160, yCol2); doc.setFont("times", "bold"); doc.text(p.m, 285, yCol2); yCol2 += (4 * pl.length) + 2; });
        if (data.Q2_OR_PART) { doc.setFont("times", "normal"); doc.text("OR", 150, yCol2); const q2Or = doc.splitTextToSize(data.Q2_OR_PART, 120); doc.text("iv.", 156, yCol2); doc.text(q2Or, 160, yCol2); doc.setFont("times", "bold"); doc.text("5", 285, yCol2); yCol2 += (4 * q2Or.length) + 6; }

        for (let q = 3; q <= 5; q++) {
            if (!data[`Q${q}_PART_1`]) continue;
            doc.setFont("times", "normal"); doc.text(`Q.${q}`, 150, yCol2);
            const marks = (q === 3 || q === 4) ? ["3", "7"] : ["2", "8"];
            const orMark = (q === 3 || q === 4) ? "7" : "8";
            const parts = [{ l: "i.", t: data[`Q${q}_PART_1`], m: marks[0] }, { l: "ii.", t: data[`Q${q}_PART_2`], m: marks[1] }];
            parts.forEach(p => { if (!p.t) return; const pl = doc.splitTextToSize(p.t, 120); doc.text(p.l, 156, yCol2); doc.text(pl, 160, yCol2); doc.setFont("times", "bold"); doc.text(p.m, 285, yCol2); yCol2 += (4 * pl.length) + 2; });
            if (data[`Q${q}_OR_PART`]) { doc.setFont("times", "normal"); doc.text("OR", 150, yCol2); const orT = doc.splitTextToSize(data[`Q${q}_OR_PART`], 120); doc.text("iii.", 156, yCol2); doc.text(orT, 160, yCol2); doc.setFont("times", "bold"); doc.text(orMark, 285, yCol2); yCol2 += (4 * orT.length) + 6; }
        }

        if (data.Q6_PART_1) {
            doc.setFont("times", "normal"); doc.text("Q.6", 150, yCol2); doc.text("Attempt any two:", 156, yCol2); yCol2 += 5;
            const q6Parts = [{ l: "i.", t: data.Q6_PART_1 }, { l: "ii.", t: data.Q6_PART_2 }, { l: "iii.", t: data.Q6_PART_3 }];
            q6Parts.forEach(p => {
                if (!p.t) return; const pl = doc.splitTextToSize(p.t, 120); const h = (4 * pl.length) + 2;
                if (yCol2 + h > 200) { doc.addPage(); yCol2 = 20; doc.setTextColor(220, 220, 220); doc.setFontSize(50); doc.setFont("times", "bold"); doc.text("MediNotes", width / 2, height / 2, { align: "center", angle: 45 }); doc.setTextColor(0, 0, 0); }
                doc.setFont("times", "normal"); doc.setFontSize(9); doc.text(p.l, 156, yCol2); doc.text(pl, 160, yCol2); doc.setFont("times", "bold"); doc.text("5", 285, yCol2); yCol2 += h;
            });
        }
        yCol2 += 6; doc.setFontSize(11); doc.setFont("times", "bold"); doc.text("******", 220, yCol2, { align: "center" });

        const pdfBlob = doc.output("blob");
        const filename = `${data.COURSE_CODE}_${data.SUBJECT_NAME.replace(/\s+/g, '_')}.pdf`;
        setGeneratedPdf({ blob: pdfBlob, filename });
    }

    // --- Handlers (From Code 2) ---
    const handleDownload = () => {
        if (!generatedPdf) return;
        const url = URL.createObjectURL(generatedPdf.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = generatedPdf.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetForm = () => {
        setGeneratedPdf(null)
        setSelectedSubject('')
    }

    // --- Helpers (From Code 1 for UI) ---
    const SelectInput = ({ label, icon: Icon, value, onChange, options, disabled, placeholder }: any) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">
                {label}
            </label>
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    <Icon size={16} />
                </div>
                <select
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className="w-full pl-10 pr-10 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={14} />
                </div>
            </div>
        </div>
    )

    if (loadingStructure) return (
        <div className="h-screen flex items-center justify-center bg-white dark:bg-[#09090b] text-sm font-medium text-gray-400">
            <Loader2 className="animate-spin mr-2" /> Loading Generator...
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-6rem)] w-full max-w-5xl mx-auto p-4 md:p-6 bg-white dark:bg-[#09090b] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">

            {/* --- HEADER (UI Code 1) --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Printer size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Exam Paper Generator</h1>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">AI-powered university standard question papers</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Daily Limit</p>
                        <p className={`text-sm font-bold ${attemptsLeft > 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                            {attemptsLeft} / 3 <span className="text-xs font-normal text-gray-500">Remaining</span>
                        </p>
                    </div>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${attemptsLeft > 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                        <Sparkles size={14} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- FORM SECTION (UI Code 1 Structure) --- */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-transparent rounded-none">

                        {!generatedPdf ? (
                            // INPUT STATE
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <SelectInput
                                            label="Select Program"
                                            icon={GraduationCap}
                                            value={selectedProgramId}
                                            onChange={(e: any) => { setSelectedProgramId(e.target.value); setSelectedYearId(''); setSelectedCourseId(''); setSelectedSubject('') }}
                                            placeholder="Choose Academic Program"
                                            options={programs.map(p => ({ value: p.id, label: p.name }))}
                                        />
                                    </div>

                                    <SelectInput
                                        label="Academic Year"
                                        icon={Calendar}
                                        value={selectedYearId}
                                        onChange={(e: any) => { setSelectedYearId(e.target.value); setSelectedCourseId(''); setSelectedSubject('') }}
                                        disabled={!selectedProgramId}
                                        placeholder="Select Year"
                                        options={years.map(y => ({ value: y.id, label: y.name }))}
                                    />

                                    <SelectInput
                                        label="Branch / Course"
                                        icon={Layers}
                                        value={selectedCourseId}
                                        onChange={(e: any) => { setSelectedCourseId(e.target.value); setSelectedSubject('') }}
                                        disabled={!selectedYearId}
                                        placeholder="Select Branch"
                                        options={courses.map(c => ({ value: c.id, label: c.name }))}
                                    />

                                    <div className="md:col-span-2">
                                        <SelectInput
                                            label="Target Subject"
                                            icon={BookOpen}
                                            value={selectedSubject}
                                            onChange={(e: any) => setSelectedSubject(e.target.value)}
                                            disabled={!selectedCourseId}
                                            placeholder="Choose Subject to Generate Paper"
                                            options={subjects.map(s => {
                                                const name = typeof s === 'string' ? s : s.name
                                                return { value: name, label: name }
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating || !selectedSubject || attemptsLeft <= 0}
                                        className={`
                                            w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm transition-all transform active:scale-[0.99]
                                            ${generating || !selectedSubject || attemptsLeft <= 0
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                                : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-xl shadow-black/5 dark:shadow-white/5'}
                                        `}
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                <span>Designing Question Paper...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileText size={18} />
                                                <span>Generate PDF Paper</span>
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-[10px] text-gray-400 mt-3">
                                        {attemptsLeft <= 0
                                            ? "Daily limit reached. Please come back tomorrow."
                                            : "Generates a printable PDF based on your syllabus structure."}
                                    </p>
                                </div>
                            </>
                        ) : (
                            // SUCCESS STATE (Adapted to UI Code 1 style)
                            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-300">
                                <div className="h-20 w-20 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="h-10 w-10 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Paper Generated!</h2>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 text-sm">
                                    Your practice paper for <span className="font-semibold text-gray-900 dark:text-white">{selectedSubject}</span> is ready to download.
                                </p>

                                <div className="flex flex-col w-full max-w-sm gap-3">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 shadow-xl shadow-black/5 dark:shadow-white/5 transition-all"
                                    >
                                        <Download size={18} />
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-transparent border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                    >
                                        <RotateCcw size={18} />
                                        Create Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- FEATURES / INFO SECTION (UI Code 1) --- */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="p-5 bg-gray-50 dark:bg-[#121214] rounded-2xl border border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">Paper Features</h3>
                        <div className="space-y-4">
                            <FeatureItem
                                title="Standard Format"
                                desc="Follows university exam patterns including sections and marks distribution."
                            />
                            <FeatureItem
                                title="Syllabus Aligned"
                                desc="Questions are derived strictly from the subject units provided."
                            />
                            <FeatureItem
                                title="Instant PDF"
                                desc="Ready-to-print file generated instantly in your browser."
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-xl flex gap-3">
                        <AlertTriangle className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                            <strong>Note:</strong> These papers are AI-generated for practice purposes. They are not official predictions for upcoming exams.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Component Helper (From UI Code 1) ---
function FeatureItem({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="flex gap-3">
            <div className="shrink-0 w-6 h-6 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-green-600 dark:text-green-400">
                <Check size={12} strokeWidth={3} />
            </div>
            <div>
                <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">{title}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}