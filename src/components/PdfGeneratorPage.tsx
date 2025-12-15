import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Download, CheckCircle, ArrowLeft, Lock, Wand2 } from 'lucide-react';

export default function PdfGeneratorPage() {
    const { token } = useAuth();

    // UI State
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfReady, setPdfReady] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRateLimited, setIsRateLimited] = useState(false);

    // Dynamic Stars Effect
    const [stars, setStars] = useState<{ top: string; left: string; size: string; opacity: number }[]>([]);

    useEffect(() => {
        const newStars = Array.from({ length: 50 }).map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 3}px`,
            opacity: Math.random()
        }));
        setStars(newStars);
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setIsRateLimited(false);
        setPdfReady(false);
        setPdfBlob(null);

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
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));

                if (response.status === 429) {
                    setIsRateLimited(true);
                    throw new Error(errData.message || 'Daily limit reached.');
                }

                throw new Error(errData.message || 'Failed to generate PDF');
            }

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
        a.download = 'generated_document.pdf';
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
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-indigo-500/30">

            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

            {/* Stars */}
            {stars.map((star, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-white animate-pulse"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        opacity: star.opacity,
                        animationDuration: `${Math.random() * 3 + 2}s`
                    }}
                />
            ))}

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12 lg:py-16 flex flex-col items-center min-h-[calc(100vh-80px)] justify-center">

                {/* Navbar (Mock) */}
                {!pdfReady && (
                    <div className="mb-12 inline-flex items-center gap-6 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                        <span className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-widest cursor-default">AI PDF Generator</span>
                    </div>
                )}

                {!pdfReady ? (
                    <div className="w-full text-center space-y-8 sm:space-y-12 animate-fade-in">

                        {/* Hero Typography */}
                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-lg">
                                Generate Stunning <br />
                                <span className="italic text-indigo-300">Documents</span>
                            </h1>
                            <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto font-light leading-relaxed px-4">
                                Turn your ideas into professional PDFs with just a few words. <br className="hidden sm:block" />
                                Applications, Letters, and Notices created instantly.
                            </p>
                        </div>

                        {/* Input Area */}
                        <div className="relative max-w-2xl mx-auto group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                            <div className="relative bg-[#0A0A0A]/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 p-2 sm:p-3 shadow-2xl">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe your document..."
                                    className="w-full h-32 sm:h-40 bg-transparent text-white placeholder-gray-600 p-4 sm:p-6 text-base sm:text-lg outline-none resize-none font-light"
                                    disabled={isGenerating}
                                />

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 pb-4">
                                    <div className="hidden sm:flex flex-wrap gap-2">
                                        {['Application', 'Letter', 'Invoice'].map(tag => (
                                            <button key={tag} onClick={() => setPrompt(p => p + (p ? ' ' : '') + tag)} className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-gray-400 hover:bg-white/5 transition">
                                                {tag}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={!prompt.trim() || isGenerating}
                                        className="w-full sm:w-auto px-8 py-3 rounded-xl sm:rounded-full bg-white text-black font-medium text-sm sm:text-base hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {isGenerating ? <Sparkles size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                        {isGenerating ? 'Generating...' : 'Generate PDF'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Rate Limit Alert */}
                        {error && (
                            <div className={`mx-auto max-w-md p-4 rounded-xl border backdrop-blur-md ${isRateLimited
                                ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                                : 'bg-red-500/10 border-red-500/30 text-red-200'
                                } text-xs sm:text-sm animate-slide-up`}>
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    {isRateLimited ? <Lock size={14} /> : <span className="text-xl">!</span>}
                                    <span className="font-semibold">{error}</span>
                                </div>
                                {isRateLimited && (
                                    <button
                                        onClick={() => document.getElementById('auth-trigger-btn')?.click()}
                                        className="text-xs underline hover:text-white transition"
                                    >
                                        Sign In for Unlimited Access
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                ) : (
                    /* Success State */
                    <div className="w-full max-w-2xl animate-fade-in text-center space-y-8 sm:space-y-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-400 ring-1 ring-green-500/30 mb-4 animate-scale-in">
                                <CheckCircle size={40} className="drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                            </div>
                            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
                                Ready to <span className="italic text-green-400">Download</span>
                            </h2>
                            <p className="text-sm text-gray-400">
                                Your professional document has been created successfully.
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-left">
                                <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">File Name</div>
                                <div className="text-lg sm:text-xl font-medium text-white truncate max-w-[200px]">generated_document.pdf</div>
                                <div className="text-xs text-gray-400 mt-1">{(pdfBlob?.size ? pdfBlob.size / 1024 : 0).toFixed(1)} KB</div>
                            </div>

                            <button
                                onClick={handleDownload}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Download size={18} />
                                Download File
                            </button>
                        </div>

                        <button
                            onClick={handleReset}
                            className="text-sm text-gray-500 hover:text-white transition flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft size={14} />
                            Create New Document
                        </button>
                    </div>
                )}

                {/* Footer Credits */}
                <div className="fixed bottom-4 text-[10px] text-gray-600 pointer-events-none">
                    Powered by AI • Extrovert
                </div>
            </div>
        </div>
    );
}