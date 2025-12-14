import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Sparkles, AlertCircle, Download, CheckCircle, ArrowLeft } from 'lucide-react';

export default function PdfGeneratorPage() {
    const { token } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfReady, setPdfReady] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setPdfReady(false);
        setPdfBlob(null);

        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to generate PDF');
            }

            // Get PDF as blob
            const blob = await response.blob();
            setPdfBlob(blob);
            setPdfReady(true);

        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
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
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="space-y-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <FileText size={28} strokeWidth={2.5} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                        AI PDF Generator
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
                        Describe your document and get a professional, ready-to-download PDF instantly.
                    </p>
                </div>

                {/* Main Content */}
                {!pdfReady ? (
                    <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-xl shadow-gray-200/50 dark:shadow-none">

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    What document do you need?
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                                    Be specific! Mention the type, purpose, and any details you want included.
                                </p>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Examples:&#10;• A professional certificate of completion for a Python programming course&#10;• An invoice for web design services with 3 itemized charges&#10;• A formal business letter requesting a meeting with the marketing director&#10;• A lost pet notice for a golden retriever with reward information&#10;• A meeting agenda for a product launch brainstorming session"
                                    className="w-full h-72 p-5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none text-sm leading-relaxed"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!prompt.trim() || isGenerating}
                                className={`
                                    w-full py-5 rounded-xl font-bold text-base tracking-wide transition-all duration-300 flex items-center justify-center gap-3
                                    ${!prompt.trim() || isGenerating
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/5 dark:text-gray-600'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/30'
                                    }
                                `}
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles className="animate-spin" size={20} />
                                        <span>Creating Your PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={20} />
                                        <span>Generate PDF</span>
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            {isGenerating && (
                                <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce"></div>
                                        </div>
                                        <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                                            AI is crafting your document...
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-xs text-indigo-700 dark:text-indigo-400">
                                        <p>✓ Analyzing document requirements</p>
                                        <p>✓ Generating professional content</p>
                                        <p>✓ Applying topic-appropriate layout</p>
                                        <p className="opacity-50">✓ Finalizing PDF...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Success State */
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-xl shadow-gray-200/50 dark:shadow-none text-center space-y-6">

                            {/* Success Icon */}
                            <div className="flex justify-center">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 animate-scale-in">
                                    <CheckCircle size={40} strokeWidth={2.5} />
                                </div>
                            </div>

                            {/* Success Message */}
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Your PDF is Ready!
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Professional document created successfully
                                </p>
                            </div>

                            {/* PDF Info */}
                            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                <FileText size={32} className="text-indigo-600 dark:text-indigo-400" />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                        generated_document.pdf
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {(pdfBlob.size / 1024).toFixed(1)} KB • PDF Document
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={20} />
                                    Download PDF
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-4 rounded-xl font-bold text-base bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} />
                                    Create Another
                                </button>
                            </div>
                        </div>

                        {/* Success Tips */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-5 flex items-start gap-3">
                            <CheckCircle size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                                    PDF Generated Successfully
                                </h4>
                                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                    Your document has been created with professional formatting, topic-appropriate layout, and detailed content. Click "Download PDF" to save it to your device.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tips Section */}
                {!pdfReady && !isGenerating && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-2">
                                📝 Be Detailed
                            </h4>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                                The more specific your description, the better the result. Include names, dates, and exact requirements.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                            <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-2">
                                🎨 Professional Design
                            </h4>
                            <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
                                Each document type gets a unique, professional layout automatically tailored to its purpose.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/10 border border-pink-100 dark:border-pink-900/20">
                            <h4 className="font-semibold text-pink-900 dark:text-pink-300 text-sm mb-2">
                                ⚡ Instant Download
                            </h4>
                            <p className="text-xs text-pink-700 dark:text-pink-400 leading-relaxed">
                                Your PDF is generated in seconds and ready to download immediately—no installation required.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
