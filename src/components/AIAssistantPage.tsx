import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, RotateCcw, Bot, Copy, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Message {
    text: string
    sender: 'user' | 'bot'
}

interface ConversationMessage {
    role: 'user' | 'assistant'
    content: string
}

export default function AIAssistantPage() {
    const { token } = useAuth()
    const [messages, setMessages] = useState<Message[]>([
        { text: "Hello! I'm your UniNotes AI tutor. I can help you study, create flashcards, quiz you on any topic, or explain complex concepts. How can I assist you today?", sender: 'bot' }
    ])
    const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
        }
    }, [input])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage = input
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }])
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
            setMessages(prev => [...prev, { text: data.answer, sender: 'bot' }])
            setConversationHistory(data.conversationHistory || [])
        } catch (error) {
            setMessages(prev => [...prev, { text: "Sorry, I encountered an error. Please try again later.", sender: 'bot' }])
        } finally {
            setIsTyping(false)
        }
    }

    const resetConversation = () => {
        setMessages([
            { text: "Hello! I'm your UniNotes AI tutor. How can I assist you today?", sender: 'bot' }
        ])
        setConversationHistory([])
    }

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const quickActions = [
        { label: 'Summarize Topic', prompt: 'Summarize the concept of ', icon: Sparkles },
        { label: 'Quiz Me', prompt: "Give me a quiz on ", icon: Sparkles },
        { label: 'Create Flashcards', prompt: 'Create flashcards for ', icon: Sparkles },
        { label: 'Explain Simply', prompt: 'Explain in simple terms: ', icon: Sparkles },
    ]

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                        <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Online & Ready to Help</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={resetConversation}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Reset Chat"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset Chat
                </button>
            </div>

            {/* Quick Actions */}
            <div className="py-4">
                <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => setInput(action.prompt)}
                            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-all hover:scale-105"
                        >
                            <action.icon className="h-4 w-4" />
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-6 py-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${msg.sender === 'user'
                                ? 'bg-black dark:bg-white'
                                : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                }`}>
                                {msg.sender === 'user' ? (
                                    <span className="text-sm font-semibold text-white dark:text-black">You</span>
                                ) : (
                                    <Bot className="h-5 w-5 text-white" />
                                )}
                            </div>

                            {/* Message Content */}
                            <div className="flex flex-col gap-2">
                                <div
                                    className={`
                                        rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm
                                        ${msg.sender === 'user'
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                        }
                                    `}
                                >
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                </div>

                                {/* Copy Button for Bot Messages */}
                                {msg.sender === 'bot' && (
                                    <button
                                        onClick={() => copyToClipboard(msg.text, idx)}
                                        className="self-start flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {copiedIndex === idx ? (
                                            <>
                                                <Check className="h-3 w-3" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3 w-3" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex items-center gap-1 rounded-2xl bg-gray-100 px-5 py-3 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex items-end gap-3">
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
                        placeholder="Ask anything... (Shift+Enter for new line)"
                        className="flex-1 max-h-40 min-h-[56px] resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-gray-700 dark:focus:ring-gray-800 transition-all"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all hover:scale-105 shadow-lg"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
                <div className="mt-3 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        AI can make mistakes. Check important information.
                    </p>
                </div>
            </div>
        </div>
    )
}
