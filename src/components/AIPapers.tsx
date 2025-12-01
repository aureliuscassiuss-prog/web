import { useState, useEffect } from 'react'
import { FileText, Download, Loader2, AlertTriangle, GraduationCap, Calendar, Layers, BookOpen, Check, CheckCircle, Sparkles, ChevronDown, Printer } from 'lucide-react'
import jsPDF from 'jspdf'
// @ts-ignore
import autoTable from 'jspdf-autotable'

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
    // Structure State
    const [structure, setStructure] = useState<{ programs: Program[] }>({ programs: [] })
    const [loadingStructure, setLoadingStructure] = useState(true)

    // Form State
    const [selectedProgramId, setSelectedProgramId] = useState('')
    const [selectedYearId, setSelectedYearId] = useState('')
    const [selectedCourseId, setSelectedCourseId] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')

    // Generation State
    const [generating, setGenerating] = useState(false)
    const [attemptsLeft, setAttemptsLeft] = useState(3) // Mock daily limit
    const [generatedPdf, setGeneratedPdf] = useState<{ blob: Blob, filename: string } | null>(null)

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

    // Derived State
    const programs = structure.programs || []
    const selectedProgram = programs.find(p => p.id === selectedProgramId)
    const years = selectedProgram?.years || []
    const selectedYear = years.find(y => y.id === selectedYearId)
    const courses = selectedYear?.courses || []
    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    const subjects = selectedCourse?.subjects || []

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

            // Parse AI response (it might be a string JSON or object)
            let paperData
            try {
                paperData = typeof data.answer === 'string' ? JSON.parse(data.answer) : data.answer
            } catch (e) {
                // Fallback if AI returns markdown code block
                const match = data.answer.match(/```json\n([\s\S]*)\n```/)
                if (match) {
                    paperData = JSON.parse(match[1])
                } else {
                    throw new Error('Failed to parse AI response')
                }
            }

            // Map AI data to the specific keys expected by the PDF generator
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
            flat.Q2_PART_1 = q[0]?.text || ''
            flat.Q2_PART_2 = q[1]?.text || ''
            flat.Q2_PART_3 = q[2]?.text || ''
            flat.Q2_OR_PART = q[3]?.text || ''

            // Q3
            flat.Q3_PART_1 = q[4]?.text || ''
            flat.Q3_PART_2 = q[5]?.text || ''
            flat.Q3_OR_PART = q[6]?.text || ''

            // Q4
            flat.Q4_PART_1 = q[7]?.text || ''
            flat.Q4_PART_2 = q[8]?.text || ''
            flat.Q4_OR_PART = q[9]?.text || ''

            // Q5
            flat.Q5_PART_1 = q[10]?.text || ''
            flat.Q5_PART_2 = q[11]?.text || ''
            flat.Q5_OR_PART = q[12]?.text || ''

            // Q6
            flat.Q6_PART_1 = q[13]?.text || ''
            flat.Q6_PART_2 = q[14]?.text || ''
            flat.Q6_PART_3 = q[15]?.text || ''
        }

        return flat
    }

    const generatePDF = (data: any) => {
        const doc = new jsPDF("landscape", "mm", "a4");
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // Watermark REMOVED
        // doc.setTextColor(220, 220, 220);
        // doc.setFontSize(50);
        // doc.setFont("times", "bold");
        // doc.text("MediNotes", width / 2, height / 2, { align: "center", angle: 45 });

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

            // Wrap options to prevent collision
            // Column 1 width ~55, Column 2 width ~60
            const optALines = doc.splitTextToSize(optA, 55);
            const optBLines = doc.splitTextToSize(optB, 60);
            const optCLines = doc.splitTextToSize(optC, 55);
            const optDLines = doc.splitTextToSize(optD, 60);

            // Calculate Height
            const hRow1 = Math.max(optALines.length, optBLines.length) * 4;
            const hRow2 = Math.max(optCLines.length, optDLines.length) * 4;
            const hBlock = (4 * lines.length) + hRow1 + hRow2 + 4;

            // Check for Column Break
            if (i === 9 && (yPos + hBlock > 200)) {
                savedQ9 = { qText, lines, optALines, optBLines, optCLines, optDLines };
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

            // Row 1 Options
            doc.text(optALines, 18, yPos);
            doc.text(optBLines, 75, yPos);
            yPos += hRow1 + 1; // +1 padding

            // Row 2 Options
            doc.text(optCLines, 18, yPos);
            doc.text(optDLines, 75, yPos);
            yPos += hRow2 + 3; // +3 padding before next question
        }

        // --- Second Column (Right Side) ---
        let yCol2 = 15;

        // Page Num Top Right
        doc.setFontSize(7);
        doc.text("[2]", 220, 8, { align: "center" });
        doc.setFontSize(9);

        // Render Q9 if saved
        if (savedQ9) {
            doc.setFont("times", "normal");
            doc.text("ix.", 156, yCol2);
            doc.text(savedQ9.lines, 160, yCol2);
            doc.setFont("times", "bold");
            doc.text("1", 285, yCol2);
            doc.setFont("times", "normal");
            yCol2 += (4 * savedQ9.lines.length);

            const hRow1 = Math.max(savedQ9.optALines.length, savedQ9.optBLines.length) * 4;
            const hRow2 = Math.max(savedQ9.optCLines.length, savedQ9.optDLines.length) * 4;

            doc.text(savedQ9.optALines, 160, yCol2);
            doc.text(savedQ9.optBLines, 220, yCol2);
            yCol2 += hRow1 + 1;

            doc.text(savedQ9.optCLines, 160, yCol2);
            doc.text(savedQ9.optDLines, 220, yCol2);
            yCol2 += hRow2 + 3;
        }

        // Render Q10
        const q10Key = "MCQ_10";
        const q10Text = data[`${q10Key}_QUESTION`];
        if (q10Text) {
            const q10Lines = doc.splitTextToSize(q10Text, 120);

            doc.text("x.", 156, yCol2);
            doc.text(q10Lines, 160, yCol2);
            doc.setFont("times", "bold");
            doc.text("1", 285, yCol2);
            doc.setFont("times", "normal");
            yCol2 += (4 * q10Lines.length);

            const optA = `(a) ${data[`${q10Key}_OPTION_A`] || ''}`;
            const optB = `(b) ${data[`${q10Key}_OPTION_B`] || ''}`;
            const optC = `(c) ${data[`${q10Key}_OPTION_C`] || ''}`;
            const optD = `(d) ${data[`${q10Key}_OPTION_D`] || ''}`;

            const optALines = doc.splitTextToSize(optA, 55);
            const optBLines = doc.splitTextToSize(optB, 60);
            const optCLines = doc.splitTextToSize(optC, 55);
            const optDLines = doc.splitTextToSize(optD, 60);

            const hRow1 = Math.max(optALines.length, optBLines.length) * 4;
            const hRow2 = Math.max(optCLines.length, optDLines.length) * 4;

            doc.text(optALines, 160, yCol2);
            doc.text(optBLines, 220, yCol2);
            yCol2 += hRow1 + 1;

            doc.text(optCLines, 160, yCol2);
            doc.text(optDLines, 220, yCol2);
            yCol2 += hRow2 + 3;
        }

        // Descriptive Q2
        doc.setFont("times", "normal");
        doc.text("Q.2", 150, yCol2);

        const q2Parts = [
            { l: "i.", t: data.Q2_PART_1, m: "2" },
            { l: "ii.", t: data.Q2_PART_2, m: "3" },
            { l: "iii.", t: data.Q2_PART_3, m: "5" },
        ];

        q2Parts.forEach(part => {
            if (!part.t) return;
            doc.setFont("times", "normal");
            const pl = doc.splitTextToSize(part.t, 120);
            doc.text(part.l, 156, yCol2);
            doc.text(pl, 160, yCol2);
            doc.setFont("times", "bold");
            doc.text(part.m, 285, yCol2);
            yCol2 += (4 * pl.length) + 2;
        });

        if (data.Q2_OR_PART) {
            doc.setFont("times", "normal");
            doc.text("OR", 150, yCol2);
            const q2Or = doc.splitTextToSize(data.Q2_OR_PART, 120);
            doc.text("iv.", 156, yCol2);
            doc.text(q2Or, 160, yCol2);
            doc.setFont("times", "bold");
            doc.text("5", 285, yCol2);
            yCol2 += (4 * q2Or.length) + 6;
        }

        // Loop Q3 - Q5
        for (let q = 3; q <= 5; q++) {
            if (!data[`Q${q}_PART_1`]) continue;

            doc.setFont("times", "normal");
            doc.text(`Q.${q}`, 150, yCol2);

            const marks = (q === 3 || q === 4) ? ["3", "7"] : ["2", "8"];
            const orMark = (q === 3 || q === 4) ? "7" : "8";

            const parts = [
                { l: "i.", t: data[`Q${q}_PART_1`], m: marks[0] },
                { l: "ii.", t: data[`Q${q}_PART_2`], m: marks[1] },
            ];

            parts.forEach(part => {
                if (!part.t) return;
                doc.setFont("times", "normal");
                const pl = doc.splitTextToSize(part.t, 120);
                doc.text(part.l, 156, yCol2);
                doc.text(pl, 160, yCol2);
                doc.setFont("times", "bold");
                doc.text(part.m, 285, yCol2);
                yCol2 += (4 * pl.length) + 2;
            });

            if (data[`Q${q}_OR_PART`]) {
                doc.setFont("times", "normal");
                doc.text("OR", 150, yCol2);
                const orText = doc.splitTextToSize(data[`Q${q}_OR_PART`], 120);
                doc.text("iii.", 156, yCol2);
                doc.text(orText, 160, yCol2);
                doc.setFont("times", "bold");
                doc.text(orMark, 285, yCol2);
                yCol2 += (4 * orText.length) + 6;
            }
        }

        // Q6
        if (data.Q6_PART_1) {
            doc.setFont("times", "normal");
            doc.text("Q.6", 150, yCol2);
            doc.text("Attempt any two:", 156, yCol2);
            yCol2 += 5;

            const q6Parts = [
                { l: "i.", t: data.Q6_PART_1 },
                { l: "ii.", t: data.Q6_PART_2 },
                { l: "iii.", t: data.Q6_PART_3 },
            ];

            q6Parts.forEach(part => {
                if (!part.t) return;
                const pl = doc.splitTextToSize(part.t, 120);
                const heightNeeded = (4 * pl.length) + 2;

                if (yCol2 + heightNeeded > 200) {
                    doc.addPage();
                    yCol2 = 20;
                    // Add Watermark to new page REMOVED
                    // doc.setTextColor(220, 220, 220);
                    // doc.setFontSize(50);
                    // doc.setFont("times", "bold");
                    // doc.text("MediNotes", width / 2, height / 2, { align: "center", angle: 45 });
                    // doc.setTextColor(0, 0, 0);
                }

                doc.setFont("times", "normal");
                doc.setFontSize(9);
                doc.text(part.l, 156, yCol2);
                doc.text(pl, 160, yCol2);
                doc.setFont("times", "bold");
                doc.text("5", 285, yCol2);
                yCol2 += heightNeeded;
            });
        }

        yCol2 += 6;
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("******", 220, yCol2, { align: "center" });

        const pdfBlob = doc.output("blob");
        const filename = `${data.COURSE_CODE}_${data.SUBJECT_NAME.replace(/\s+/g, '_')}.pdf`;

        setGeneratedPdf({ blob: pdfBlob, filename });
    }

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans p-4 md:p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                    AI-Powered Sample Papers
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">Generate realistic practice question papers in university format</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-2xl font-bold ${attemptsLeft > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                    {attemptsLeft}/3
                                </span>
                                <span className="text-xs text-gray-400">left today</span>
                            </div>
                        </div>

                        {!generatedPdf ? (
                            <div className="space-y-4">
                                {/* Program */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Program</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <select
                                            value={selectedProgramId}
                                            onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedYearId(''); setSelectedCourseId(''); setSelectedSubject('') }}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        >
                                            <option value="">Select Program</option>
                                            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Year */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Year</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <select
                                            value={selectedYearId}
                                            onChange={(e) => { setSelectedYearId(e.target.value); setSelectedCourseId(''); setSelectedSubject('') }}
                                            disabled={!selectedProgramId}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:opacity-50"
                                        >
                                            <option value="">Select Year</option>
                                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Branch */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Branch</label>
                                    <div className="relative">
                                        <Layers className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <select
                                            value={selectedCourseId}
                                            onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedSubject('') }}
                                            disabled={!selectedYearId}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:opacity-50"
                                        >
                                            <option value="">Select Branch</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Subject</label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            disabled={!selectedCourseId}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black focus:ring-2 focus:ring-blue-500 outline-none appearance-none disabled:opacity-50"
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map((s, i) => {
                                                const name = typeof s === 'string' ? s : s.name
                                                return <option key={i} value={name}>{name}</option>
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !selectedSubject || attemptsLeft <= 0}
                                    className={`
                                        w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all
                                        ${generating || !selectedSubject || attemptsLeft <= 0
                                            ? 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}
                                    `}
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Generating Paper...
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={20} />
                                            Generate Paper
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            // Success State
                            <div className="space-y-6 py-4">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Paper Generated Successfully!</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Your practice paper for {selectedSubject} is ready.</p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:opacity-90 transition-opacity"
                                    >
                                        <Download size={20} />
                                        Download PDF
                                    </button>

                                    <button
                                        onClick={resetForm}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Generate Another Paper
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="text-orange-600 dark:text-orange-400 shrink-0" size={20} />
                        <p className="text-sm text-orange-800 dark:text-orange-300">
                            <strong>Important:</strong> These are practice papers generated by AI for study purposes only. They are not official university papers. Misuse may lead to disciplinary action.
                        </p>
                    </div>
                </div>

                {/* Right Column: Features */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">What You Get</h3>
                        <div className="space-y-4">
                            <FeatureItem
                                title="University Format"
                                desc="Standard university question paper layout with proper headers and formatting"
                            />
                            <FeatureItem
                                title="Syllabus-Based Content"
                                desc="Questions generated from comprehensive syllabus data using advanced AI"
                            />
                            <FeatureItem
                                title="Complete Structure"
                                desc="10 MCQs + descriptive questions with proper marks distribution (60 marks)"
                            />
                            <FeatureItem
                                title="Instant Download"
                                desc="PDF generated instantly with proper course codes and subject details"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureItem({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="flex gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mt-0.5">
                <Check size={12} strokeWidth={3} />
            </div>
            <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}