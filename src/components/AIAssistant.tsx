import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { getAIResponse } from '../services/ai'

interface Message {
    text: string
    sender: 'user' | 'bot'
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { text: "Hello! I'm your AI study assistant. How can I help you today?", sender: 'bot' }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage = input
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }])
        setInput('')
        setIsTyping(true)

        try {
            const response = await getAIResponse(userMessage)
            setMessages(prev => [...prev, { text: response, sender: 'bot' }])
        } catch (error) {
            setMessages(prev => [...prev, { text: "Sorry, I encountered an error. Please try again.", sender: 'bot' }])
        } finally {
            setIsTyping(false)
        }
    }

    const quickActions = [
        { label: '📝 Summarize', prompt: 'Summarize the concept of Binary Trees' },
        { label: '🧠 Quiz Me', prompt: "Give me a quiz on Newton's Laws" },
        { label: '🎴 Flashcards', prompt: 'Create flashcards for Organic Chemistry' },
    ]

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 right-8 w-auto h-14 px-6 bg-black dark:bg-red-600 text-white rounded-full shadow-lg flex items-center gap-3 font-semibold hover:scale-105 transition-all duration-300 z-40 animate-float shadow-black/20 dark:shadow-red-600/30"
            >
                <MessageCircle className="w-6 h-6" />
                <span>Ask AI</span>
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-8 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-40 animate-modal-in">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 rounded-t-xl">
                        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <Sparkles className="w-5 h-5 text-red-600" />
                            MediNotes AI
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto bg-gray-50 dark:bg-gray-900/50">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => setInput(action.prompt)}
                                className="whitespace-nowrap px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-full hover:border-red-600 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-gray-950">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[85%] p-3 rounded-2xl animate-slide-in text-sm leading-relaxed ${msg.sender === 'user'
                                    ? 'ml-auto bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-br-sm'
                                    : 'bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-gray-100 border border-red-100 dark:border-red-900/30 rounded-bl-sm'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-1 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl rounded-bl-sm w-fit">
                                <div className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 bg-white dark:bg-gray-900 rounded-b-xl">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            placeholder="Ask a question..."
                            rows={1}
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
