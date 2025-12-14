import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Code, Check, Copy, Sparkles, AlertCircle, Download, Terminal } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function PdfGeneratorPage() {
    const { token } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedCode(null);

        try {
            const systemPrompt = `You are a Python expert specializing in professional PDF generation. 
Your task is to write a complete, runnable Python script using the 'fpdf' library to generate a HIGH - QUALITY, professionally formatted PDF based on the user's description.

CRITICAL FORMATTING RULES:
1. ** Layout **: Use proper margins(25mm), line spacing(1.5), and alignment.
2. ** Typography **: Use standard fonts(Arial, Times).Use Bold / Large fonts for Titles(size 16 - 24), Regular for body(size 11 - 12).
3. ** Structure **:
    - Header: Include a professional header if appropriate.
   - Body: text wrapping(multi_cell) is MANDATORY for long text.DO NOT use single line 'cell' for paragraphs.
   - Footer: Include page numbers.
4. ** Content **: Ensure the content matches the user's request exactly (Notices, Resumes, etc.).
5. ** Output **: The script must save the file as 'generated_document.pdf'.

Return ONLY the Python code block.No markdown wrapper text outside the code block.`;

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token} `
                },
                body: JSON.stringify({
                    action: 'chat',
                    question: prompt,
                    systemPrompt: systemPrompt
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate code');
            }

            const data = await response.json();

            // Extract code from markdown block if present
            const text = data.answer || '';
            const codeMatch = text.match(/```python([\s\S] *?)```/);
            const cleanCode = codeMatch ? codeMatch[1].trim() : text;

            setGeneratedCode(cleanCode);

        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!generatedCode) return;

        const blob = new Blob([generatedCode], { type: 'text/x-python' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generate_pdf.py';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="space-y-4 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                AI PDF Generator
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                Describe your document, get the Python code to build it.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Input Section */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-xl shadow-gray-200/50 dark:shadow-none h-full flex flex-col">

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Document Description
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                                    Be specific about layout, fonts, and content.
                                </p>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Examples:&#10;- A formal notice for a lost cat named Luna with a reward...&#10;- A certificate of completion for a web development course...&#10;- A simple invoice template with a table of items..."
                                    className="w-full h-64 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none text-sm leading-relaxed"
                                />
                            </div>

                            <div className="mt-auto">
                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || isGenerating}
                                    className={`
w - full py - 4 rounded - xl font - bold text - sm tracking - wide transition - all duration - 300 flex items - center justify - center gap - 2
                                        ${!prompt.trim() || isGenerating
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/5 dark:text-gray-600'
                                            : 'bg-black text-white hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-black shadow-lg shadow-black/5 dark:shadow-white/5'
                                        }
`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Sparkles className="animate-spin" size={18} />
                                            <span>Generating Code...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Code size={18} />
                                            <span>Generate Python Code</span>
                                        </>
                                    )}
                                </button>
                                {error && (
                                    <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-xl shadow-gray-200/50 dark:shadow-none h-full min-h-[500px] flex flex-col">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                    </div>
                                    <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">generator.py</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {generatedCode && (
                                        <>
                                            <button
                                                onClick={handleDownload}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                                                title="Download Python Script"
                                            >
                                                <Download size={14} />
                                                <span className="hidden sm:inline">Download</span>
                                            </button>
                                            <button
                                                onClick={handleCopy}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                                            >
                                                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Code Area */}
                            <div className="relative flex-1 bg-[#1e1e1e] overflow-auto">
                                {!generatedCode && !isGenerating && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-600 p-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <Code size={32} />
                                        </div>
                                        <p className="max-w-[200px] text-sm md:text-base">Generated Python code will appear here ready to copy or download.</p>
                                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-500">Includes professional formatting & layout.</p>
                                    </div>
                                )}

                                {isGenerating && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-white/5 backdrop-blur-sm z-10">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                                        </div>
                                        <span className="text-xs font-mono text-gray-400">Simulating PDF Layout...</span>
                                    </div>
                                )}

                                {generatedCode && (
                                    <SyntaxHighlighter
                                        language="python"
                                        style={vscDarkPlus}
                                        customStyle={{
                                            margin: 0,
                                            padding: '1.5rem',
                                            fontSize: '0.875rem',
                                            lineHeight: '1.6',
                                            background: 'transparent'
                                        }}
                                        showLineNumbers={true}
                                        wrapLines={true}
                                    >
                                        {generatedCode}
                                    </SyntaxHighlighter>
                                )}
                            </div>
                        </div>

                        {/* Instructions (New) */}
                        {generatedCode && (
                            <div className="animate-fade-in bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-4 flex items-start gap-3">
                                <Terminal size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">How to run this?</h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                                        1. Download the script or copy the code.<br />
                                        2. Run <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">pip install fpdf</code> in your terminal.<br />
                                        3. Run <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">python generate_pdf.py</code> to create the PDF file.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tips Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-1">Be Descriptive</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400">Mention font sizes, colors, and precise positions for the best results.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-1">Standard Libs</h4>
                        <p className="text-xs text-purple-700 dark:text-purple-400">We prioritize `fpdf` and `reportlab` which are standard and reliable.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/20">
                        <h4 className="font-semibold text-pink-900 dark:text-pink-300 text-sm mb-1">Run Locally</h4>
                        <p className="text-xs text-pink-700 dark:text-pink-400">Install the required library (`pip install fpdf`) and run the script.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
