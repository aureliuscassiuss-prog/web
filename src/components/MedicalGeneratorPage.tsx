import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useAuth } from '../contexts/AuthContext';
import { FileText, CheckCircle, ArrowLeft } from 'lucide-react';

// Custom 4-Point Star Icon matching the reference image
const FourPointStar = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="starGradientMedical" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" /> {/* Teal-500 */}
                <stop offset="50%" stopColor="#10b981" /> {/* Emerald-500 */}
                <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
            </linearGradient>
        </defs>
        <path
            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
            fill="url(#starGradientMedical)"
            stroke="url(#starGradientMedical)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
        />
    </svg>
);

const MedicalGeneratorPage = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        patient_name: '',
        patient_age: '',
        patient_gender: 'Male',
        test_date: new Date().toISOString().split('T')[0],
        report_date: new Date().toISOString().split('T')[0],
        referring_doctor: '',
        signing_doctor: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenderChange = (value: string) => {
        setFormData(prev => ({ ...prev, patient_gender: value }));
    };

    const generatePdf = async () => {
        setIsLoading(true);
        try {
            const existingPdfBytes = await fetch('/certificate_template_with_fields.pdf').then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const form = pdfDoc.getForm();

            const fieldMappings: { [key: string]: string } = {
                'text_2hcpn': formData.patient_name,
                'text_3ydqz': formData.test_date,
                'text_4ybok': formData.report_date,
                'text_5rysh': formData.referring_doctor,
                'text_6njmy': formData.patient_name,
                'text_10vfgg': formData.test_date,
                'text_11aaku': formData.signing_doctor,
                'text_7wpva': formData.patient_age,
                'text_8uoj': formData.referring_doctor,
                'text_9quis': formData.report_date,
                'text_11ikbs': formData.signing_doctor,
            };

            for (const [fieldName, value] of Object.entries(fieldMappings)) {
                try {
                    const field = form.getTextField(fieldName);
                    if (field) {
                        field.setText(value);
                    }
                } catch (error) {
                    console.warn(`Field ${fieldName} not found in PDF`, error);
                }
            }

            form.flatten();
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Medical_Certificate_${formData.patient_name.replace(/\s+/g, '_')}.pdf`;
            link.click();
            setIsSuccess(true);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please ensure the template exists and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        generatePdf();
    };

    const handleReset = () => {
        setIsSuccess(false);
        setFormData({
            patient_name: '',
            patient_age: '',
            patient_gender: 'Male',
            test_date: new Date().toISOString().split('T')[0],
            report_date: new Date().toISOString().split('T')[0],
            referring_doctor: '',
            signing_doctor: ''
        });
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                    You need to be logged in to access the Medical Generator.
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white relative overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-500">

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

            <div className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-8 sm:pt-24 pb-20">

                {/* Navbar Badge */}
                {!isSuccess && (
                    <div className="mb-6 sm:mb-8 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md shadow-sm dark:shadow-2xl">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Student Tool</span>
                    </div>
                )}

                {!isSuccess ? (
                    <div className="w-full max-w-4xl space-y-8 animate-fade-in-up">
                        {/* Heading */}
                        <div className="text-center space-y-4 sm:space-y-6 mb-12">
                            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl leading-[0.9] text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-2xl tracking-tight">
                                Medical <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-300 dark:via-cyan-200 dark:to-teal-300">Hub</span>
                            </h1>
                            <p className="text-slate-600 dark:text-zinc-500 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                                Generate official medical certificates instantly.
                            </p>
                        </div>

                        {/* INPUT CONSOLE */}
                        <div className="relative w-full max-w-3xl mx-auto group">
                            {/* --- BORDER BEAM (Medical Theme) --- */}
                            <div className="absolute -inset-[2px] rounded-[26px] sm:rounded-[34px] overflow-hidden pointer-events-none z-0">
                                <div
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500%] h-[500%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0_300deg,#14b8a6_330deg,#10b981_360deg)] opacity-100"
                                    style={{ animationDuration: '4s' }}
                                />
                            </div>

                            <div className="relative bg-white dark:bg-[#09090b] rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none p-[2px]">
                                <div className="bg-slate-50 dark:bg-[#09090b] rounded-[22px] sm:rounded-[30px] p-6 sm:p-10 transition-colors duration-500 hover:bg-slate-100 dark:hover:bg-[#0c0c0f]">

                                    <form onSubmit={handleSubmit} className="space-y-8">

                                        {/* Row 1 */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-1">Patient Name</label>
                                                <input
                                                    type="text"
                                                    name="patient_name"
                                                    required
                                                    value={formData.patient_name}
                                                    onChange={handleChange}
                                                    placeholder="Full Name"
                                                    className="w-full bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-1">Age</label>
                                                <input
                                                    type="text"
                                                    name="patient_age"
                                                    required
                                                    value={formData.patient_age}
                                                    onChange={handleChange}
                                                    placeholder="Age"
                                                    className="w-full bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Gender & Dates */}
                                        <div className="space-y-4">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-1">Gender</label>
                                            <div className="flex bg-slate-200/50 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 w-fit">
                                                {['Male', 'Female', 'Other'].map((gender) => (
                                                    <button
                                                        key={gender}
                                                        type="button"
                                                        onClick={() => handleGenderChange(gender)}
                                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${formData.patient_gender === gender
                                                            ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm'
                                                            : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
                                                            }`}
                                                    >
                                                        {gender}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-1">Test Date</label>
                                                <input
                                                    type="date"
                                                    name="test_date"
                                                    required
                                                    value={formData.test_date}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-1">Report Date</label>
                                                <input
                                                    type="date"
                                                    name="report_date"
                                                    required
                                                    value={formData.report_date}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 3: Doctors */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-white/5">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-1">Referring Doctor (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="referring_doctor"
                                                    value={formData.referring_doctor}
                                                    onChange={handleChange}
                                                    placeholder="Dr. Smith"
                                                    className="w-full bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-widest pl-1">Signing Doctor</label>
                                                <input
                                                    type="text"
                                                    name="signing_doctor"
                                                    value={formData.signing_doctor}
                                                    onChange={handleChange}
                                                    placeholder="Dr. Johnson"
                                                    className="w-full bg-slate-200/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2 px-1 pb-1">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="group relative w-full inline-flex items-center justify-center p-[1px] rounded-full overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 animate-gradient-xy opacity-100"></div>
                                                <div className="relative w-full py-4 bg-black rounded-full flex items-center justify-center gap-3 transition-all group-hover:bg-[#0c0c0f]">
                                                    <FourPointStar className={`w-6 h-6 text-white ${isLoading ? 'animate-spin' : ''}`} />
                                                    <span className="font-semibold text-white text-lg tracking-wide">
                                                        {isLoading ? 'Generating Certificate...' : 'Generate Certificate'}
                                                    </span>
                                                </div>
                                            </button>
                                        </div>

                                    </form>

                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    /* Success View */
                    <div className="w-full max-w-lg mx-auto text-center space-y-8 animate-fade-in-up pt-12">
                        <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center ring-1 ring-green-500/20 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)] animate-scale-in">
                                <CheckCircle className="text-green-500 w-10 h-10" />
                            </div>
                            <h2 className="text-4xl font-serif text-slate-900 dark:text-white tracking-tight">Certificate Ready</h2>
                            <p className="text-slate-500 dark:text-zinc-400">The medical certificate has been downloaded.</p>
                        </div>

                        <button
                            onClick={handleReset}
                            className="text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white text-sm transition-colors flex items-center gap-2 mx-auto hover:underline decoration-slate-300 dark:decoration-zinc-700 underline-offset-4"
                        >
                            <ArrowLeft size={16} /> Create Another
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pb-6 text-center text-slate-400 dark:text-zinc-600 text-[10px] sm:text-xs select-none">
                    <p>Powered by Extrovert Medical</p>
                    <p className="mt-1 opacity-70">This tool is for educational purposes only.</p>
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

                @keyframes tilt {
                    0%, 50%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(0.5deg); }
                    75% { transform: rotate(-0.5deg); }
                }
                .animate-tilt { animation: tilt 10s infinite linear; }
                
                .animate-gradient-xy {
                    background-size: 200% 200%;
                    animation: gradient-xy 6s ease infinite;
                }
                @keyframes gradient-xy {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
};

export default MedicalGeneratorPage;
