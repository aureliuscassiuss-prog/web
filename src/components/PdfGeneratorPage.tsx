import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Download, CheckCircle, ArrowLeft, Wand2, ChevronDown } from 'lucide-react';

export default function PdfGeneratorPage() {
    const { token } = useAuth();

    // UI State
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfReady, setPdfReady] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [fileName, setFileName] = useState('generated_document.pdf');
    const [font, setFont] = useState('helvetica');

    const [isFontOpen, setIsFontOpen] = useState(false);
    const fontDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
                setIsFontOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fonts = [
        { id: 'helvetica', name: 'Classic', family: 'Helvetica, Arial, sans-serif' },
        { id: 'times', name: 'Professional', family: '"Times New Roman", Times, serif' },
        { id: 'courier', name: 'Typewriter', family: '"Courier New", Courier, monospace' },
    ];

    const selectedFontObj = fonts.find(f => f.id === font) || fonts[0];

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setIsRateLimited(false);
        setPdfReady(false);
        setPdfBlob(null);
        setFileName('generated_document.pdf');

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers,
                body: JSON.stringify({ prompt, font })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));

                if (response.status === 429) {
                    setIsRateLimited(true);
                    throw new Error(errData.message || 'Daily limit reached.');
                }

                throw new Error(errData.message || 'Failed to generate PDF');
            }

            // Extract filename from Content-Disposition
            const contentDisposition = response.headers.get('Content-Disposition');
            let downloadedFileName = 'generated_document.pdf';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    downloadedFileName = filenameMatch[1];
                }
            }
            setFileName(downloadedFileName);

            const blob = await response.blob();
            setPdfBlob(blob);
            setPdfReady(true);

        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsGenerating(false);
        }
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

    const handleReset = () => {
        setPdfReady(false);
        setPdfBlob(null);
        setPrompt('');
        setError(null);
        setIsRateLimited(false);
        setFileName('generated_document.pdf');
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

            {/* Layout Container */}
            <div className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-8 sm:pt-32">

                {/* Navbar Badge */}
                {!pdfReady && (
                    <div className="mb-6 sm:mb-10 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md shadow-sm dark:shadow-2xl">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em]">AI Powered</span>
                    </div>
                )}

                {!pdfReady ? (
                    <div className="w-full max-w-4xl text-center space-y-6 sm:space-y-12 animate-fade-in-up">

                        {/* Heading - Responsive Color */}
                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl leading-[0.9] text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-2xl tracking-tight">
                                Generate <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 dark:from-indigo-300 dark:via-white dark:to-blue-300">Stunning Documents</span>
                            </h1>
                            <p className="hidden sm:block text-slate-600 dark:text-zinc-500 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                                Transform your thoughts into professional PDF documents instantly.
                            </p>
                            <p className="sm:hidden text-slate-600 dark:text-zinc-500 text-sm max-w-xs mx-auto font-light leading-relaxed">
                                Create professional PDFs with AI.
                            </p>
                        </div>

                        {/* REDESIGNED INPUT CONSOLE - "Sleek Module" for Light & Dark */}
                        <div className="relative w-full max-w-2xl mx-auto group">

                            {/* Animated Gradient: Very Subtle in Light Mode, Vibrant in Dark */}
                            <div className="absolute -inset-[2px] rounded-[26px] sm:rounded-[34px] bg-[conic-gradient(from_0deg_at_50%_50%,#00000000_0deg,#3b82f6_180deg,#00000000_360deg)] animate-spin-slow opacity-30 dark:opacity-100"></div>
                            <div className="absolute -inset-[2px] rounded-[26px] sm:rounded-[34px] bg-[conic-gradient(from_180deg_at_50%_50%,#00000000_0deg,#8b5cf6_180deg,#00000000_360deg)] animate-spin-slow opacity-30 dark:opacity-100" style={{ animationDelay: '-1.5s' }}></div>

                            {/* Main Box - White in Light Mode, Black in Dark Mode */}
                            <div className="relative bg-white dark:bg-[#09090b] rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">

                                <div className="p-[2px]">
                                    <div className="bg-slate-50 dark:bg-[#09090b] rounded-[22px] sm:rounded-[30px] p-5 sm:p-8 transition-colors duration-500 hover:bg-slate-100 dark:hover:bg-[#0c0c0f]">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Describe your document..."
                                            className="w-full h-24 sm:h-32 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 text-lg sm:text-xl font-normal outline-none resize-none leading-relaxed tracking-wide"
                                            disabled={isGenerating}
                                        />

                                        <div className="flex items-center justify-center mt-2 pt-4 border-t border-slate-200 dark:border-white/5">

                                            {/* Centered Custom Font Dropdown */}
                                            <div className="relative" ref={fontDropdownRef}>
                                                <button
                                                    onClick={() => setIsFontOpen(!isFontOpen)}
                                                    className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-medium px-4 py-2 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all outline-none"
                                                    style={{ fontFamily: selectedFontObj.family }}
                                                >
                                                    {selectedFontObj.name}
                                                    <ChevronDown size={14} className={`text-slate-400 dark:text-zinc-500 transition-transform ${isFontOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Smart Dropdown Menu - appears below by default, above if not enough space */}
                                                {isFontOpen && (
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-44 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                        {fonts.map((f) => (
                                                            <button
                                                                key={f.id}
                                                                onClick={() => {
                                                                    setFont(f.id);
                                                                    setIsFontOpen(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${font === f.id
                                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                                                                    }`}
                                                                style={{ fontFamily: f.family }}
                                                            >
                                                                {f.name}
                                                                {font === f.id && <CheckCircle size={14} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Full Width Action Bar */}
                                <div className="p-1 pt-0">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!prompt.trim() || isGenerating}
                                        className="w-full rounded-[20px] sm:rounded-[28px] bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black py-3 sm:py-5 font-semibold text-base sm:text-lg transition-all active:scale-[0.99] flex items-center justify-center gap-3 shadow-lg shadow-slate-200/50 dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] hover:shadow-xl dark:hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {isGenerating ? <Sparkles size={18} className="animate-spin text-indigo-400 dark:text-indigo-600" /> : <Wand2 size={18} />}
                                        {isGenerating ? 'Generating Magic...' : 'Generate Document'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Error/Rate Limit */}
                        {error && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-200 text-sm animate-fade-in-up">
                                <span>{error}</span>
                                {isRateLimited && (
                                    <button onClick={() => document.getElementById('auth-trigger-btn')?.click()} className="underline hover:text-red-800 dark:hover:text-white">Sign In</button>
                                )}
                            </div>
                        )}

                    </div>
                ) : (
                    /* Success View - Redesigned Console Style */
                    <div className="w-full max-w-lg mx-auto text-center space-y-8 animate-fade-in-up pt-12">

                        <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center ring-1 ring-green-500/20 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)] animate-scale-in">
                                <CheckCircle className="text-green-500 w-10 h-10" />
                            </div>
                            <h2 className="text-4xl font-serif text-slate-900 dark:text-white tracking-tight">Document Ready</h2>
                            <p className="text-slate-500 dark:text-zinc-400">Your PDF has been generated successfully.</p>
                        </div>

                        {/* Console Card */}
                        <div className="relative group w-full">
                            {/* Gradient Border */}
                            <div className="absolute -inset-[2px] rounded-[26px] bg-[conic-gradient(from_0deg_at_50%_50%,#00000000_0deg,#22c55e_180deg,#00000000_360deg)] animate-spin-slow opacity-30 dark:opacity-100"></div>

                            <div className="relative bg-white dark:bg-[#09090b] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden p-[2px]">
                                <div className="bg-slate-50 dark:bg-[#09090b] rounded-[22px] p-6 transition-colors hover:bg-slate-100 dark:hover:bg-[#0c0c0f]">

                                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-white/5">
                                        <div className="text-left">
                                            <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">File Name</div>
                                            <div className="text-base font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{fileName}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Size</div>
                                            <div className="text-base font-medium text-slate-900 dark:text-white">{(pdfBlob?.size ? pdfBlob.size / 1024 : 0).toFixed(1)} KB</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleDownload}
                                        className="w-full rounded-[18px] bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black py-4 font-semibold text-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        <Download size={20} />
                                        Download PDF
                                    </button>
                                </div>
                            </div>
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
                <div className="fixed bottom-4 sm:bottom-6 text-slate-400 dark:text-zinc-800 text-[10px] sm:text-xs pointer-events-none select-none">
                    Powered by Extrovert AI
                </div>
            </div>

            <style>{`
                @keyframes tilt {
                    0%, 50%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(0.5deg); }
                    75% { transform: rotate(-0.5deg); }
                }
                .animate-tilt { animation: tilt 10s infinite linear; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
            `}</style>
        </div>
    );
}