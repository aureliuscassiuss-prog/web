import { useState, useRef, useEffect } from 'react'
import {
    Send, Sparkles, RotateCcw, Bot, Copy, Check,
    User, ThumbsUp, ThumbsDown, ArrowDown
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
}

interface ConversationMessage {
    role: 'user' | 'assistant'
    content: string
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
    const [isTyping, setIsTyping] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // --- Refs ---
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    // --- Effects ---
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    // Fetch History on Mount
    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) return;
            try {
                const res = await fetch('/api/ai?action=history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.history && Array.isArray(data.history) && data.history.length > 0) {
                        const historyMessages: Message[] = data.history.map((msg: any, i: number) => ({
                            id: `hist-${i}`,
                            text: msg.content,
                            sender: msg.role === 'user' ? 'user' : 'bot',
                            timestamp: new Date()
                        }));

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
            }
        };
        fetchHistory();
    }, [token]);

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
        if (!input.trim()) return

        const userMessage = input.trim()
        const newMsgId = Date.now().toString()

        setMessages(prev => [...prev, {
            id: newMsgId,
            text: userMessage,
            sender: 'user',
            timestamp: new Date()
        }])

        setInput('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.focus()
        }
        setIsTyping(true)

        try {
            const headers: any = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    action: 'chat',
                    question: userMessage,
                    conversationHistory
                })
            })

            if (!response.ok) throw new Error('Failed to get AI response')
            const data = await response.json()

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: data.answer,
                sender: 'bot',
                feedback: null,
                timestamp: new Date()
            }])
            setConversationHistory(data.conversationHistory || [])

        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I encountered an error. Please try again later.",
                sender: 'bot',
                feedback: null,
                timestamp: new Date()
            }])
        } finally {
            setIsTyping(false)
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

    return (
        /* Outer container: Fixed height to viewport minus layout offset, column flex */
        <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white dark:bg-[#050505] font-sans text-gray-900 dark:text-gray-100 overflow-hidden relative rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">

            {/* --- HEADER (Fixed) --- */}
            <header className="flex-none z-20 flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm">
                        <Bot size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold leading-tight">AI Tutor</h1>
                        <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Online</span>
                        </div>
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

                    {messages.map((msg) => (
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
                                        rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                                        ${msg.sender === 'user'
                                            ? 'bg-black text-white rounded-tr-sm dark:bg-white dark:text-black'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm dark:bg-gray-900 dark:border-white/10 dark:text-gray-100'}
                                    `}>
                                        {msg.text}
                                    </div>

                                    {/* Bot Actions (Small) */}
                                    {msg.sender === 'bot' && (
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
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex gap-2 max-w-[85%]">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black mt-1">
                                    <Bot size={12} />
                                </div>
                                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-gray-50 px-3 py-2 dark:bg-gray-900 border border-gray-100 dark:border-white/10">
                                    <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
                                    <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
                                    <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400"></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invisible div to scroll to */}
                    <div ref={messagesEndRef} className="h-px" />
                </div>
            </main>

            {/* --- FOOTER (Fixed) --- */}
            <footer className="flex-none bg-white dark:bg-[#050505] border-t border-gray-100 dark:border-white/10 z-20 pb-[env(safe-area-inset-bottom)]">

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
                    <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-white/5 rounded-[1.5rem] p-1.5 transition-all focus-within:ring-1 focus-within:ring-black/10 dark:focus-within:ring-white/10">
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
                            placeholder="Type a message..."
                            className="flex-1 max-h-[100px] min-h-[40px] w-full resize-none bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className={`
                                flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all mb-1 mr-1
                                ${!input.trim() || isTyping
                                    ? 'bg-gray-300 text-gray-500 dark:bg-white/10 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-black text-white hover:scale-105 active:scale-95 dark:bg-white dark:text-black'}
                            `}
                        >
                            <Send size={14} className={input.trim() ? "ml-0.5" : ""} />
                        </button>
                    </div>
                    <p className="text-[9px] text-center text-gray-400 dark:text-gray-600 mt-1.5">
                        AI can produce inaccurate info.
                    </p>
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