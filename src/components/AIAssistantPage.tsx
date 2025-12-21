import { useState, useRef, useEffect } from 'react'
import {
    Send, Sparkles, RotateCcw, Bot, Copy, Check,
    User, ThumbsUp, ThumbsDown, Paperclip, X, Square, ChevronDown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ReactMarkdown from 'react-markdown'

// --- Types ---
interface Message {
    id: string
    text: string
    sender: 'user' | 'bot'
    feedback?: 'like' | 'dislike' | null
    timestamp: Date
    image?: string
}

interface ConversationMessage {
    role: 'user' | 'assistant'
    content: string | Array<any>
}

export default function AIAssistantPage() {
    const { token, user } = useAuth()

    // --- State ---
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init-1',
            text: "Hello! I'm your Extrovert AI tutor. I can help you study, create flashcards, quiz you on any topic, or explain complex concepts.",
            sender: 'bot',
            feedback: null,
            timestamp: new Date()
        }
    ])
    const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
    const [input, setInput] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isTyping, setIsTyping] = useState(false)
    const [isWaiting, setIsWaiting] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile')
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)

    const models = [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Recommended)' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
        { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' },
        { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B' },
        { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B' },
        { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B' },
        { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2' },
        { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' },
        { id: 'groq/compound', name: 'Groq Compound' },
    ]

    // --- Refs ---
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cancellation & Interval Refs
    const abortControllerRef = useRef<AbortController | null>(null);
    const intervalRef = useRef<any>(null);

    // --- Effects ---
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior })
    }

    // Smart Scroll: Only scroll if user is already near the bottom
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        // Calculate if we are near the bottom (threshold 150px)
        // If we are, we stick to the bottom. If user scrolled up, we don't force it.
        // We also force scroll if the last message is from the user (they just sent it)
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        const lastMessage = messages[messages.length - 1];
        const isUserLast = lastMessage?.sender === 'user';

        if (isNearBottom || (isUserLast && !isTyping)) {
            scrollToBottom();
        }
    }, [messages, isTyping, isLoadingHistory])

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsTyping(false);
        setIsWaiting(false);
    };

    // Fetch History on Mount
    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) {
                setIsLoadingHistory(false)
                return;
            }
            try {
                const res = await fetch('/api/ai?action=history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.history && Array.isArray(data.history) && data.history.length > 0) {
                        const historyMessages: Message[] = data.history.map((msg: any, i: number) => {
                            let textContent = '';
                            let imageContent = undefined;

                            if (Array.isArray(msg.content)) {
                                textContent = msg.content.find((c: any) => c.type === 'text')?.text || '';
                                imageContent = msg.content.find((c: any) => c.type === 'image_url')?.image_url?.url;
                            } else {
                                textContent = msg.content;
                            }

                            return {
                                id: `hist-${i}`,
                                text: textContent,
                                sender: msg.role === 'user' ? 'user' : 'bot',
                                timestamp: new Date(),
                                image: imageContent
                            }
                        });

                        setMessages(prev => {
                            // Keep initial greeting if history is empty or if it's just the default
                            if (prev.length === 1 && prev[0].id === 'init-1') {
                                return [prev[0], ...historyMessages];
                            }
                            return historyMessages.length > 0 ? historyMessages : prev;
                        });
                        setConversationHistory(data.history);
                    }
                }
            } catch (err) {
                console.error('Failed to load history', err);
            } finally {
                setIsLoadingHistory(false)
            }
        };
        fetchHistory();
    }, [token]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                const compressed = await compressImage(file)
                setSelectedImage(compressed)
            } catch (err) {
                console.error("Compression failed", err)
            }
        }
    }

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800; // Limit for performance/bandwidth
                    const MAX_HEIGHT = 800;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height = Math.round((height *= MAX_WIDTH / width));
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width = Math.round((width *= MAX_HEIGHT / height));
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.6)); // JPEG 60%
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            const maxHeight = 100; // Cap height at ~4 lines
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, maxHeight) + 'px'
        }
    }, [input])

    // --- Handlers ---
    const handleSend = async () => {
        if (!input.trim() && !selectedImage) return

        const userMessage = input.trim()
        const userImage = selectedImage
        const newMsgId = Date.now().toString()

        setMessages(prev => [...prev, {
            id: newMsgId,
            text: userMessage,
            sender: 'user',
            timestamp: new Date(),
            image: userImage || undefined
        }])

        setInput('')
        setSelectedImage(null)
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.focus()
        }
        setIsTyping(true)
        setIsWaiting(true)

        // Initialize AbortController
        abortControllerRef.current = new AbortController();

        try {
            const headers: any = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`

            // Remove large images from history payload to avoid 413 or slow requests
            const activeHistory = conversationHistory.map(msg => {
                if (Array.isArray(msg.content)) {
                    // Just keep text for history
                    const text = msg.content.find(c => c.type === 'text')?.text || ''
                    return { role: msg.role, content: text }
                }
                return msg
            })

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    action: 'chat',
                    question: userMessage,
                    image: userImage,
                    conversationHistory: activeHistory,
                    model: selectedModel
                }),
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || errData.details || 'Failed to get AI response');
            }
            const data = await response.json()

            // Simulate typing effect
            setIsWaiting(false);
            // We DON'T set isTyping false here yet, we wait for typing to finish
            const botMsgId = (Date.now() + 1).toString();

            // Add empty message first
            setMessages(prev => [...prev, {
                id: botMsgId,
                text: '', // Start empty for typewriter
                sender: 'bot',
                feedback: null,
                timestamp: new Date()
            }]);

            let i = -1;
            const fullText = data.answer;
            const typingSpeed = 15; // ms per char

            intervalRef.current = setInterval(() => {
                i++;
                if (i >= fullText.length) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setIsTyping(false);
                    abortControllerRef.current = null;
                    return;
                }

                setMessages(prev => prev.map(msg =>
                    msg.id === botMsgId
                        ? { ...msg, text: fullText.substring(0, i + 1) }
                        : msg
                ));
            }, typingSpeed);

            setConversationHistory(data.conversationHistory || [])

        } catch (error: any) {
            setIsWaiting(false);
            if (error.name === 'AbortError') {
                console.log('Generation stopped by user');
                setIsTyping(false);
                return;
            }
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `Error: ${error.message || "Something went wrong."}`,
                sender: 'bot',
                feedback: null,
                timestamp: new Date()
            }])
        }
    }

    const resetConversation = async () => {
        if (token) {
            try {
                await fetch('/api/ai?action=clear', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) { console.error(e); }
        }

        setMessages([{
            id: Date.now().toString(),
            text: "Hello! I'm your Extrovert AI tutor. How can I assist you today?",
            sender: 'bot',
            feedback: null,
            timestamp: new Date()
        }])
        setConversationHistory([])
    }

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) { console.error('Failed to copy:', err) }
    }

    const handleFeedback = (id: string, type: 'like' | 'dislike') => {
        setMessages(prev => prev.map(msg =>
            msg.id === id ? { ...msg, feedback: msg.feedback === type ? null : type } : msg
        ))
    }

    const quickActions = [
        { label: 'Summarize', prompt: 'Summarize the concept of ', icon: Sparkles },
        { label: 'Quiz Me', prompt: "Give me a quiz on ", icon: Sparkles },
        { label: 'Simplify', prompt: 'Explain simply: ', icon: Sparkles },
    ]

    // --- Visual Viewport Handling for Mobile Keyboard ---
    const [viewportHeight, setViewportHeight] = useState(
        typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 0
    )
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height)
                if (window.innerWidth < 768) {
                    setTimeout(() => scrollToBottom('auto'), 100)
                }
            }
        }

        window.visualViewport?.addEventListener('resize', handleResize)
        window.addEventListener('resize', handleResize)

        // Initial set
        handleResize()

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (

        <div
            className={`
                flex flex-col bg-white dark:bg-[#050505] font-sans text-gray-900 dark:text-gray-100 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200 ease-out
                ${isMobile ? 'fixed top-16 bottom-0 inset-x-0 z-20 rounded-none border-x-0 border-b-0' : 'relative h-[calc(100vh-8.5rem)]'}
            `}
        >
            {/* Header Adjustment for Mobile (Hide local header if fixed? No, keep it) */}
            <header className="flex-none z-20 flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm">
                        <Bot size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}>
                            <h1 className="text-sm font-bold leading-tight">
                                {models.find(m => m.id === selectedModel)?.name.split('(')[0].trim() || 'AI Tutor'}
                            </h1>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Online</span>
                        </div>

                        {isModelMenuOpen && (
                            <div className="absolute top-12 left-4 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                                {models.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            setSelectedModel(model.id)
                                            setIsModelMenuOpen(false)
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 ${selectedModel === model.id
                                            ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <div className="font-medium">{model.name}</div>
                                        <div className="text-[10px] text-gray-400 truncate">{model.id}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={resetConversation}
                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                    title="New Chat"
                >
                    <RotateCcw size={16} />
                </button>
            </header>

            {/* --- CHAT AREA (Scrollable) --- */}
            <main
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10"
            >
                <div className="flex flex-col gap-4 p-4 pb-2">
                    {/* Date Divider */}
                    <div className="flex justify-center my-2">
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                            Today
                        </span>
                    </div>

                    {isLoadingHistory ? (
                        /* Skeleton Loading for History */
                        <div className="flex flex-col gap-4 w-full animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-2 max-w-[75%] ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                                        <div className="flex flex-col gap-2 w-[200px]">
                                            <div className="h-10 rounded-2xl bg-gray-200 dark:bg-gray-800 w-full"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                                <div className={`flex gap-2 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                    {/* Avatar (Small) */}
                                    <div className={`
                                    flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-1 overflow-hidden
                                    ${msg.sender === 'user'
                                            ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                                            : 'bg-black text-white dark:bg-white dark:text-black'}
                                `}>
                                        {msg.sender === 'user' ? (
                                            user?.avatar ? (
                                                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={12} />
                                            )
                                        ) : (
                                            <Bot size={12} />
                                        )}
                                    </div>

                                    {/* Content Bubble (Compact) */}
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className={`
                                        rounded-2xl px-3 py-2 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm flex flex-col gap-1
                                        ${msg.sender === 'user'
                                                ? 'bg-black text-white rounded-tr-sm dark:bg-[#ffffff] dark:text-black font-medium'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm dark:bg-gray-900 dark:border-white/10 dark:text-gray-100'}
                                    `}>
                                            {msg.image && (
                                                <img src={msg.image} alt="User upload" className="rounded-lg max-h-60 w-auto object-cover border border-white/20" />
                                            )}
                                            <div
                                                className={`prose prose-sm max-w-none break-words ${msg.sender === 'user'
                                                    ? 'dark:prose-neutral'
                                                    : 'dark:prose-invert'
                                                    }`}
                                                style={msg.sender === 'user' ? {
                                                    color: 'inherit',
                                                    '--tw-prose-body': 'inherit',
                                                    '--tw-prose-headings': 'inherit',
                                                    '--tw-prose-links': 'inherit',
                                                    '--tw-prose-bold': 'inherit',
                                                    '--tw-prose-counters': 'inherit',
                                                    '--tw-prose-bullets': 'inherit',
                                                    '--tw-prose-quotes': 'inherit',
                                                    '--tw-prose-code': 'inherit',
                                                    '--tw-prose-hr': 'inherit',
                                                    '--tw-prose-th-borders': 'inherit',
                                                } as React.CSSProperties : undefined}
                                            >
                                                <ReactMarkdown components={{
                                                    code: (props: any) => <CodeBlock {...props} sender={msg.sender} />,
                                                    pre: ({ children }: any) => <>{children}</>
                                                }}>
                                                    {msg.text}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Bot Actions (Small) */}
                                        {msg.sender === 'bot' && !isTyping && msg.text.length > 0 && (
                                            <div className="flex items-center gap-2 px-1">
                                                <ActionBtn
                                                    onClick={() => copyToClipboard(msg.text, msg.id)}
                                                    icon={copiedId === msg.id ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                                                    label={copiedId === msg.id ? "Copied" : "Copy"}
                                                    active={copiedId === msg.id}
                                                />
                                                <div className="h-2 w-px bg-gray-200 dark:bg-white/10"></div>
                                                <div className="flex gap-1">
                                                    <ActionBtn
                                                        onClick={() => handleFeedback(msg.id, 'like')}
                                                        icon={<ThumbsUp size={10} />}
                                                        active={msg.feedback === 'like'}
                                                        activeClass="text-green-600 dark:text-green-400"
                                                    />
                                                    <ActionBtn
                                                        onClick={() => handleFeedback(msg.id, 'dislike')}
                                                        icon={<ThumbsDown size={10} />}
                                                        active={msg.feedback === 'dislike'}
                                                        activeClass="text-red-600 dark:text-red-400"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Typing Indicator / "Thinking" */}
                    {isWaiting && (
                        <div className="flex justify-start">
                            <div className="flex gap-2 max-w-[85%]">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black mt-1">
                                    <Bot size={12} />
                                </div>
                                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-gray-50 px-3 py-2 dark:bg-gray-900 border border-gray-100 dark:border-white/10">
                                    <span className="text-xs text-gray-400 animate-pulse font-medium">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invisible div to scroll to */}
                    <div ref={messagesEndRef} className="h-px" />
                </div>
            </main>

            {/* --- FOOTER (Fixed) --- */}
            <footer className={`flex-none bg-white dark:bg-[#050505] border-t border-gray-100 dark:border-white/10 z-20 ${isMobile ? 'pb-2' : 'pb-[env(safe-area-inset-bottom)]'}`}>

                {/* Quick Actions - Compact */}
                <div className="px-3 py-2 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 w-max">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => setInput(action.prompt)}
                                className="flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600 hover:border-black hover:text-black dark:border-white/5 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white dark:hover:text-white transition-colors active:scale-95"
                            >
                                <action.icon size={10} />
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Field - Compact */}
                <div className="p-3 pt-0">
                    {/* Image Preview */}
                    {selectedImage && (
                        <div className="mb-2 relative inline-block mx-2">
                            <img src={selectedImage} alt="Preview" className="h-14 w-auto rounded-lg border border-gray-200 dark:border-gray-800 object-cover" />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5 shadow-md hover:bg-red-500 transition-colors"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    )}

                    <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-white/5 rounded-[1.5rem] p-1.5 transition-all focus-within:ring-1 focus-within:ring-black/10 dark:focus-within:ring-white/10">
                        {/* File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-white dark:text-gray-400 dark:hover:bg-white/10 transition-colors mb-1 ml-1"
                            title="Upload Image"
                        >
                            <Paperclip size={18} />
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            placeholder={selectedImage ? "Ask about this image..." : "Type a message..."}
                            className="flex-1 max-h-[100px] min-h-[36px] w-full resize-none bg-transparent px-3 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            rows={1}
                        />
                        <button
                            onClick={isTyping ? handleStop : handleSend}
                            disabled={(!input.trim() && !selectedImage) && !isTyping}
                            className={`
                                flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all mb-1 mr-1
                                ${(!input.trim() && !selectedImage) && !isTyping
                                    ? 'bg-gray-300 text-gray-500 dark:bg-white/10 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-black text-white hover:scale-105 active:scale-95 dark:bg-white dark:text-black'}
                            `}
                        >
                            {isTyping ? (
                                <Square size={14} className="fill-current animate-pulse" />
                            ) : (
                                <Send size={14} className={(input.trim() || selectedImage) ? "ml-0.5" : ""} />
                            )}
                        </button>
                    </div>
                </div>
            </footer>

            {/* CSS for hiding scrollbar on quick actions */}
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}

// --- Helper Component ---

function ActionBtn({ onClick, icon, label, active, activeClass }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors
                ${active ? (activeClass || 'text-green-600') : 'text-gray-400 dark:text-gray-500'}
            `}
        >
            {icon}
            {label && <span className="text-[10px] font-medium">{label}</span>}
        </button>
    )
}

function CodeBlock({ inline, className, children, sender, ...props }: any) {
    const [isCopied, setIsCopied] = useState(false)
    const match = /language-(\w+)/.exec(className || '')
    const codeText = String(children).replace(/\n$/, '')
    const isUser = sender === 'user'

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codeText)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy code', err)
        }
    }

    if (inline) {
        return (
            <code className={`${className} bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 rounded px-1 py-0.5`} {...props}>
                {children}
            </code>
        )
    }

    return (
        <div className={`
            relative group overflow-hidden border font-mono text-sm
            ${isUser
                ? 'my-2 -mx-3 w-[calc(100%+1.5rem)] rounded-none border-y border-gray-200 dark:border-white/10'
                : 'my-4 rounded-lg border-gray-200 dark:border-white/10'
            }
        `}>
            <div className={`
                flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-white/10
                ${isUser ? 'bg-gray-200 dark:bg-zinc-800' : ''}
            `}>
                <span className="text-xs text-gray-500">{match ? match[1] : 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    {isCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="overflow-x-auto bg-gray-50 dark:bg-black p-3 text-gray-900 dark:text-gray-100">
                <code className={className} {...props}>
                    {children}
                </code>
            </div>
        </div>
    )
}