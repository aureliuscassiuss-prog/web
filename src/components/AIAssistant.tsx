import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles, RotateCcw, Bot } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ReactMarkdown from 'react-markdown'

interface Message {
    id: string
    text: string
    sender: 'user' | 'bot'
}

interface ConversationMessage {
    role: 'user' | 'assistant'
    content: string
}

export default function AIAssistant() {
    const { token } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { id: 'init-1', text: "Hello! I'm your Extrovert AI tutor. I can help you study, create flashcards, or quiz you on any topic. How can I assist you today?", sender: 'bot' }
    ])
    const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [messages, isTyping, isOpen, isLoadingHistory])

    // Fetch History on Open
    useEffect(() => {
        const fetchHistory = async () => {
            if (!token || !isOpen) return;

            // Only fetch if we haven't already loaded history (or simpler: fetch every time open)
            // But let's check if we have messages other than init
            if (messages.length > 1) return;

            setIsLoadingHistory(true);
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
                            sender: msg.role === 'user' ? 'user' : 'bot'
                        }));

                        setMessages(prev => {
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
                setIsLoadingHistory(false);
            }
        };

        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, token]);

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage = input.trim()
        const newMsgId = Date.now().toString()

        setMessages(prev => [...prev, { id: newMsgId, text: userMessage, sender: 'user' }])
        setInput('')
        setIsTyping(true)

        try {
            const headers: any = {
                'Content-Type': 'application/json'
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    action: 'chat',
                    question: userMessage,
                    conversationHistory
                })
            })

            if (!response.ok) {
                throw new Error('Failed to get AI response')
            }

            const data = await response.json()

            // Simulate typing effect
            setIsTyping(false);
            const botMsgId = (Date.now() + 1).toString();

            setMessages(prev => [...prev, { id: botMsgId, text: '', sender: 'bot' }]);

            let i = -1;
            const fullText = data.answer;
            const typingSpeed = 15;

            const interval = setInterval(() => {
                i++;
                if (i >= fullText.length) {
                    clearInterval(interval);
                    return;
                }

                setMessages(prev => prev.map(msg =>
                    msg.id === botMsgId
                        ? { ...msg, text: fullText.substring(0, i + 1) }
                        : msg
                ));
            }, typingSpeed);

            setConversationHistory(data.conversationHistory || [])
        } catch (error) {
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), text: "Sorry, I encountered an error. Please try again later.", sender: 'bot' }])
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
        setMessages([
            { id: Date.now().toString(), text: "Hello! I'm your Extrovert AI tutor. How can I assist you today?", sender: 'bot' }
        ])
        setConversationHistory([])
    }

    const quickActions = [
        { label: 'Summarize', prompt: 'Summarize the concept of ' },
        { label: 'Quiz Me', prompt: "Give me a quiz on " },
        { label: 'Flashcards', prompt: 'Create flashcards for ' },
    ]

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full 
                    px-6 py-4 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl
                    ${isOpen
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                        : 'bg-black text-white dark:bg-white dark:text-black'
                    }
                `}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                <span className="font-semibold">{isOpen ? 'Close' : 'Ask AI Tutor'}</span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[380px] h-[600px] max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-black z-40 animate-slide-up">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 bg-white/80 p-4 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                <Bot className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={resetConversation}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                            title="Reset Chat"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-black scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">

                        {isLoadingHistory ? (
                            <div className="flex flex-col gap-4 w-full animate-pulse">
                                {[1, 2].map((i) => (
                                    <div key={i} className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-2 max-w-[85%] ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0"></div>
                                            <div className="h-8 rounded-2xl bg-gray-200 dark:bg-gray-800 w-[150px]"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`
                                            max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                                            ${msg.sender === 'user'
                                                ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-none'
                                                : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'
                                            }
                                        `}
                                    >
                                        {msg.sender === 'bot' ? (
                                            <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                                                {msg.text}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <span className="text-xs text-gray-500 animate-pulse font-medium">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions (Horizontal Scroll) */}
                    <div className="border-t border-gray-100 bg-gray-50/50 p-2 dark:border-gray-800 dark:bg-gray-900/50">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 pb-1">
                            {quickActions.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => setInput(action.prompt)}
                                    className="flex items-center gap-1 whitespace-nowrap rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black">
                        <div className="flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                    }
                                }}
                                placeholder="Ask anything..."
                                className="flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-0 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-gray-700"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mt-2 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                AI can make mistakes. Check important info.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}