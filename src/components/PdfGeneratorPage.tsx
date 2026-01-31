import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Download, CheckCircle, ArrowLeft, ChevronDown, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

// --- Data Constants (Ported from pdf_gen) ---
const BRANCHES: Record<string, string> = {
    cse: "CSE", "cse-ai": "CSE-AI", "cse-ds": "CSE-DS", it: "IT",
    ece: "ECE", civil: "Civil", mechanical: "Mechanical", "1st-year": "All Branches"
};

const SUBJECTS: Record<string, { name: string, code: string }> = {
    "object-oriented-programming": { name: "Object Oriented Programming", code: "CS3CO30" },
    "data-structures": { name: "Data Structures", code: "CS3CO31" },
    "computer-networks": { name: "Computer Networks", code: "CS3CO43" },
    "operating-systems": { name: "Operating Systems", code: "CS3CO47" },
    "software-engineering": { name: "Software Engineering", code: "CS3CO40" },
    "database-management-systems": { name: "Database Management Systems", code: "CS3CO39" },
    "maths-1": { name: "Engineering Mathematics-I", code: "EN3BS11" },
    "physics": { name: "Engineering Physics", code: "EN3BS16" },
    "chemistry": { name: "Engineering Chemistry", code: "EN3BS14" }
};

// Custom 4-Point Star Icon
const FourPointStar = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
        </defs>
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#starGradient)" stroke="url(#starGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
    </svg>
);

export default function PdfGeneratorPage() {
    // UI State
    const [selectedBranch, setSelectedBranch] = useState('cse');
    const [selectedSubject, setSelectedSubject] = useState('object-oriented-programming');

    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfReady, setPdfReady] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [fileName, setFileName] = useState('');

    const [isBranchOpen, setIsBranchOpen] = useState(false);
    const [isSubjectOpen, setIsSubjectOpen] = useState(false);

    // Mock Content Generator
    const generateMockContent = (subject: string, code: string, branchSlug: string) => {
        const content: any = {
            EXAM_MONTH: "Oct",
            EXAM_YEAR: "2024",
            COURSE_CODE: code,
            SUBJECT_NAME: subject,
            PROGRAMME: "B.Tech.",
            BRANCH: BRANCHES[branchSlug] || "CSE",
            // MCQs
            ...Array.from({ length: 10 }).reduce((acc: any, _, i) => {
                const num = i + 1;
                acc[`MCQ_${num}_QUESTION`] = `Sample Question ${num} for ${subject}. This is a generated question to test layout?`;
                acc[`MCQ_${num}_OPTION_A`] = "First Option Text";
                acc[`MCQ_${num}_OPTION_B`] = "Second Option Text";
                acc[`MCQ_${num}_OPTION_C`] = "Third Option Text";
                acc[`MCQ_${num}_OPTION_D`] = "Fourth Option Text";
                return acc;
            }, {}),
            // Descriptive
            Q2_PART_1: "Explain the fundamental concepts of this subject in detail.",
            Q2_PART_2: "Differentiate between Concept A and Concept B with examples.",
            Q2_PART_3: "Write a short note on the architecture of the system.",
            Q2_OR_PART: "Explain the lifecycle of a component in this context.",
            Q3_PART_1: "What is the significance of this topic in modern engineering?",
            Q3_PART_2: "Analyze the given problem statement and provide a solution.",
            Q3_OR_PART: "Discuss the advantages and disadvantages of the proposed method.",
            Q4_PART_1: "Define the term and explain its properties.",
            Q4_PART_2: "Illustrate the process with a neat diagram.",
            Q4_OR_PART: "Derive the equation for the following scenario.",
            Q5_PART_1: "Compare and contrast the two major algorithms.",
            Q5_PART_2: "Explain the implementation details of the module.",
            Q5_OR_PART: "What are the theoretical limitations of this approach?",
            Q6_PART_1: "Describe the methodology used in analysis.",
            Q6_PART_2: "Discuss the applications and limitations.",
            Q6_PART_3: "Compare different approaches used in the industry."
        };
        return content;
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setPdfReady(false);
        setPdfBlob(null);

        // Simulate async delay for effect
        setTimeout(() => {
            try {
                const subjectData = SUBJECTS[selectedSubject];
                const data = generateMockContent(subjectData.name, subjectData.code, selectedBranch);
                const generatedFileName = `${data.COURSE_CODE}_${data.SUBJECT_NAME.replace(/\s+/g, '_')}.pdf`;

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

                let savedQ9: any = null;

                for (let i = 1; i <= 9; i++) {
                    const key = `MCQ_${i}`;
                    const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"];

                    doc.setFont("times", "normal");
                    const qText = data[`${key}_QUESTION`];
                    const lines = doc.splitTextToSize(qText, 115);

                    const optA = `(a) ${data[`${key}_OPTION_A`]}`;
                    const optB = `(b) ${data[`${key}_OPTION_B`]}`;
                    const optC = `(c) ${data[`${key}_OPTION_C`]}`;
                    const optD = `(d) ${data[`${key}_OPTION_D`]}`;

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

                    doc.text(optA, 18, yPos);
                    doc.text(optB, 75, yPos);
                    yPos += 4.5;
                    doc.text(optC, 18, yPos);
                    doc.text(optD, 75, yPos);
                    yPos += 7.5;
                }

                // --- Second Column ---
                let yCol2 = 15;

                doc.setFontSize(7);
                doc.text("[2]", 220, 8, { align: "center" });
                doc.setFontSize(9);

                if (savedQ9) {
                    doc.setFont("times", "normal");
                    doc.text("ix.", 156, yCol2);
                    doc.text(savedQ9.lines, 160, yCol2);
                    doc.setFont("times", "bold");
                    doc.text("1", 285, yCol2);
                    doc.setFont("times", "normal");
                    yCol2 += (4 * savedQ9.lines.length);
                    doc.text(savedQ9.optA, 160, yCol2);
                    doc.text(savedQ9.optB, 220, yCol2);
                    yCol2 += 4.5;
                    doc.text(savedQ9.optC, 160, yCol2);
                    doc.text(savedQ9.optD, 220, yCol2);
                    yCol2 += 11.5;
                }

                const q10Key = "MCQ_10";
                const q10Text = data[`${q10Key}_QUESTION`];
                const q10Lines = doc.splitTextToSize(q10Text, 120);

                doc.text("x.", 156, yCol2);
                doc.text(q10Lines, 160, yCol2);
                doc.setFont("times", "bold");
                doc.text("1", 285, yCol2);
                doc.setFont("times", "normal");
                yCol2 += (4 * q10Lines.length);

                doc.text(`(a) ${data[`${q10Key}_OPTION_A`]}`, 160, yCol2);
                doc.text(`(b) ${data[`${q10Key}_OPTION_B`]}`, 220, yCol2);
                yCol2 += 4.5;
                doc.text(`(c) ${data[`${q10Key}_OPTION_C`]}`, 160, yCol2);
                doc.text(`(d) ${data[`${q10Key}_OPTION_D`]}`, 220, yCol2);
                yCol2 += 10;

                doc.setFont("times", "normal");
                doc.text("Q.2", 150, yCol2);

                const q2Parts = [
                    { l: "i.", t: data.Q2_PART_1, m: "2" },
                    { l: "ii.", t: data.Q2_PART_2, m: "3" },
                    { l: "iii.", t: data.Q2_PART_3, m: "5" },
                ];

                q2Parts.forEach(part => {
                    doc.setFont("times", "normal");
                    const pl = doc.splitTextToSize(part.t, 120);
                    doc.text(part.l, 156, yCol2);
                    doc.text(pl, 160, yCol2);
                    doc.setFont("times", "bold");
                    doc.text(part.m, 285, yCol2);
                    yCol2 += (4 * pl.length) + 2;
                });

                doc.setFont("times", "normal");
                doc.text("OR", 150, yCol2);
                const q2Or = doc.splitTextToSize(data.Q2_OR_PART, 120);
                doc.text("iv.", 156, yCol2);
                doc.text(q2Or, 160, yCol2);
                doc.setFont("times", "bold");
                doc.text("5", 285, yCol2);
                yCol2 += (4 * q2Or.length) + 6;

                for (let q = 3; q <= 5; q++) {
                    doc.setFont("times", "normal");
                    doc.text(`Q.${q}`, 150, yCol2);

                    const marks = (q === 3 || q === 4) ? ["3", "7"] : ["2", "8"];
                    const orMark = (q === 3 || q === 4) ? "7" : "8";

                    const parts = [
                        { l: "i.", t: data[`Q${q}_PART_1`], m: marks[0] },
                        { l: "ii.", t: data[`Q${q}_PART_2`], m: marks[1] },
                    ];

                    parts.forEach(part => {
                        doc.setFont("times", "normal");
                        const pl = doc.splitTextToSize(part.t, 120);
                        doc.text(part.l, 156, yCol2);
                        doc.text(pl, 160, yCol2);
                        doc.setFont("times", "bold");
                        doc.text(part.m, 285, yCol2);
                        yCol2 += (4 * pl.length) + 2;
                    });

                    doc.setFont("times", "normal");
                    doc.text("OR", 150, yCol2);
                    const orText = doc.splitTextToSize(data[`Q${q}_OR_PART`], 120);
                    doc.text("iii.", 156, yCol2);
                    doc.text(orText, 160, yCol2);
                    doc.setFont("times", "bold");
                    doc.text(orMark, 285, yCol2);
                    yCol2 += (4 * orText.length) + 6;
                }

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
                    const pl = doc.splitTextToSize(part.t, 120);
                    const heightNeeded = (4 * pl.length) + 2;

                    if (yCol2 + heightNeeded > 200) {
                        doc.addPage();
                        yCol2 = 20;
                        doc.setTextColor(220, 220, 220);
                        doc.setFontSize(50);
                        doc.setFont("times", "bold");
                        doc.text("MediNotes", width / 2, height / 2, { align: "center", angle: 45 });
                        doc.setTextColor(0, 0, 0);
                    }

                    doc.setFont("times", "normal");
                    doc.setFontSize(9);
                    doc.text(part.l, 156, yCol2);
                    doc.text(pl, 160, yCol2);
                    doc.setFont("times", "bold");
                    doc.text("5", 285, yCol2);
                    yCol2 += heightNeeded;
                });

                yCol2 += 6;
                doc.setFontSize(11);
                doc.setFont("times", "bold");
                doc.text("******", 220, yCol2, { align: "center" });

                setFileName(generatedFileName);
                setPdfBlob(doc.output('blob'));
                setPdfReady(true);
            } catch (error) {
                console.error(error);
            } finally {
                setIsGenerating(false);
            }
        }, 1500);
    };

    const handleDownload = () => {
        if (!pdfBlob) return;
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white relative overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-500">
            {/* STARS: Only in Dark Mode */}
            <div className="absolute inset-0 z-0 hidden dark:block">
                {Array.from({ length: 40 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 2}px`,
                            height: `${Math.random() * 2}px`,
                            opacity: Math.random() * 0.4 + 0.1,
                            animationDuration: `${Math.random() * 5 + 3}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-8 sm:pt-32">
                {!pdfReady && (
                    <div className="mb-6 sm:mb-10 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md shadow-sm dark:shadow-2xl">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em]">End Sem Exam Generator</span>
                    </div>
                )}

                <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-12 animate-fade-in-up">
                    <div className="space-y-4 sm:space-y-6">
                        <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl leading-[0.9] text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-2xl tracking-tight">
                            Generate <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 dark:from-indigo-300 dark:via-white dark:to-blue-300">Exam Papers</span>
                        </h1>
                        <p className="text-slate-600 dark:text-zinc-500 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                            Create standard university-style exam papers instantly.
                        </p>
                    </div>

                    {!pdfReady ? (
                        <div className="relative w-full max-w-xl mx-auto group">
                            <div className="absolute -inset-[2px] rounded-[26px] sm:rounded-[34px] overflow-hidden pointer-events-none z-0">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500%] h-[500%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0_300deg,#6366f1_330deg,#a855f7_360deg)] opacity-100" style={{ animationDuration: '4s' }} />
                            </div>

                            <div className="relative z-10 bg-white dark:bg-[#09090b] rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/5 shadow-2xl p-2">
                                <div className="bg-slate-50 dark:bg-[#09090b] rounded-[22px] sm:rounded-[30px] p-8 space-y-6">

                                    {/* Branch Selection */}
                                    <div className="space-y-2 text-left">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsBranchOpen(!isBranchOpen)}
                                                className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium hover:border-indigo-500 transition"
                                            >
                                                {BRANCHES[selectedBranch]}
                                                <ChevronDown size={16} className={`transition-transform ${isBranchOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isBranchOpen && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                                    {Object.entries(BRANCHES).map(([key, label]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => { setSelectedBranch(key); setIsBranchOpen(false); }}
                                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subject Selection */}
                                    <div className="space-y-2 text-left">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                                                className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium hover:border-indigo-500 transition"
                                            >
                                                {SUBJECTS[selectedSubject]?.name || 'Select Subject'}
                                                <ChevronDown size={16} className={`transition-transform ${isSubjectOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isSubjectOpen && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                                    {Object.entries(SUBJECTS).map(([key, val]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => { setSelectedSubject(key); setIsSubjectOpen(false); }}
                                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                                                        >
                                                            {val.name} ({val.code})
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isGenerating ? <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" /> : <FourPointStar className="w-5 h-5" />}
                                        {isGenerating ? 'Generating...' : 'Generate Paper'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Success View */
                        <div className="max-w-md mx-auto space-y-8 animate-fade-in-up">
                            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center ring-1 ring-green-500/20 shadow-lg animate-scale-in">
                                <CheckCircle className="text-green-500 w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Paper Ready!</h2>
                                <p className="text-slate-500 mt-2">{fileName}</p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                <Download size={20} /> Download PDF
                            </button>
                            <button
                                onClick={() => setPdfReady(false)}
                                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={16} /> Create Another
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes spin-beam {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-beam 8s linear infinite;
                    transform-origin: center center;
                }
            `}</style>
        </div>
    );
}