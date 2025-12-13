import { useState, useEffect, useRef } from 'react'
import { Send, User, Clock, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessage {
    id: string
    content: string
    user_id: string
    user_name: string
    user_avatar?: string
    created_at: string
}

interface TypingUser {
    user_id: string
    user_name: string
}

export default function CoffeeChat() {
    const { user } = useAuth()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<any>(null)
    const typingTimeoutRef = useRef<any>(null)

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Initialize Chat
    useEffect(() => {
        const fetchMessages = async () => {
            // Get messages from last 4 hours
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

            const { data, error } = await supabase
                .from('coffee_chat_messages')
                .select('*')
                .gt('created_at', fourHoursAgo)
                .order('created_at', { ascending: true })

            if (error) console.error('Error fetching messages:', error)
            if (data) setMessages(data)
            setIsLoading(false)
        }

        fetchMessages()

        // Realtime Subscription
        const channel = supabase.channel('coffee_chat_room')

        channel
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'coffee_chat_messages' },
                (payload) => {
                    const newMsg = payload.new as ChatMessage
                    setMessages(prev => [...prev, newMsg])
                }
            )
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const typing: TypingUser[] = []

                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.typing && p.user_id !== user?.id) {
                            typing.push({ user_id: p.user_id, user_name: p.user_name })
                        }
                    })
                })
                setTypingUsers(typing)
            })
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    const handleTyping = () => {
        if (!channelRef.current || !user) return

        channelRef.current.track({ typing: true, user_id: user.id, user_name: user.name })

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        typingTimeoutRef.current = setTimeout(() => {
            channelRef.current.track({ typing: false, user_id: user.id, user_name: user.name })
        }, 1500)
    }

    const handleSend = async () => {
        if (!newMessage.trim() || !user) return

        const msgContent = newMessage.trim()
        setNewMessage('') // Optimistic clear

        // Remove typing status immediately
        if (channelRef.current) {
            channelRef.current.track({ typing: false, user_id: user.id, user_name: user.name })
        }

        const { error } = await supabase.from('coffee_chat_messages').insert({
            content: msgContent,
            user_id: user.id.toString(),
            user_name: user.name,
            user_avatar: user.avatar
        })

        if (error) {
            console.error('Failed to send:', error)
            alert('Failed to send message')
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Check if running with placeholder credentials
    const isConfigMissing = supabase.supabaseUrl.includes('placeholder')

    if (isConfigMissing) {
        return (
            <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <Trash2 size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Chat Unavailable</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    The chat system is not configured correctly. Detected missing Supabase credentials.
                </p>
                <div className="bg-gray-100 dark:bg-zinc-900 p-4 rounded-lg text-xs text-left font-mono overflow-x-auto max-w-full">
                    <p className="text-gray-500 mb-2">Required Environment Variables:</p>
                    <p>VITE_SUPABASE_URL=...</p>
                    <p>VITE_SUPABASE_ANON_KEY=...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-between items-center backdrop-blur-sm">
                <div>
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        ☕️ Coffee Chat
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
                            Live
                        </span>
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        Messages disappear after 4 hours
                    </p>
                </div>
                <div className="text-xs text-gray-400">
                    {messages.length} messages
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                        Loading conversations...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 opacity-50">
                        <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-900">
                            <Send size={24} />
                        </div>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.user_id === user?.id?.toString()
                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                <div className={`flex max-w-[80%] md:max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className="flex-shrink-0 mt-1">
                                        {msg.user_avatar ? (
                                            <img src={msg.user_avatar} alt={msg.user_name} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {msg.user_name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                                {isMe ? 'You' : msg.user_name}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {formatTime(msg.created_at)}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm break-words relative group ${isMe
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
                <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 italic flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                    {typingUsers.length === 1
                        ? `${typingUsers[0].user_name} is typing...`
                        : `${typingUsers.length} people are typing...`}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-end gap-2 relative bg-gray-50 dark:bg-zinc-900/50 p-2 rounded-xl border border-gray-200 dark:border-gray-800 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    {!user && (
                        <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Please sign in to chat
                            </span>
                        </div>
                    )}
                    <textarea
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value)
                            handleTyping()
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 max-h-32 min-h-[40px] resize-none text-gray-900 dark:text-white placeholder-gray-400"
                        rows={1}
                        style={{ height: 'auto', minHeight: '40px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || !user}
                        className={`p-2 rounded-lg transition-all flex-shrink-0 mb-0.5 ${newMessage.trim() && user
                            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20'
                            : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
