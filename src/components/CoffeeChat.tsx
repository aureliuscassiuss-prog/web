import { useState, useEffect, useRef } from 'react'
import { Send, User, Clock, Trash2, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

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
    user_avatar?: string
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
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Sound Effects
    const playSendSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
        audio.volume = 0.5
        audio.play().catch(e => console.log('Audio play failed', e))
    }

    const playReceiveSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3')
        audio.volume = 0.5
        audio.play().catch(e => console.log('Audio play failed', e))
    }

    // Scroll to bottom on new messages
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, typingUsers])

    // Initialize Chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (supabase.supabaseUrl.includes('placeholder')) {
                setIsLoading(false)
                return
            }

            // Get messages from last 4 hours
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

            const { data, error } = await supabase
                .from('coffee_chat_messages')
                .select('*')
                .gt('created_at', fourHoursAgo)
                .order('created_at', { ascending: true })

            if (data) setMessages(data)
            if (error) console.error('Error fetching messages:', error)

            setIsLoading(false)
        }

        fetchMessages()

        if (supabase.supabaseUrl.includes('placeholder')) return

        // Realtime Subscription
        const channel = supabase.channel('coffee_chat_room')

        channel
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'coffee_chat_messages' },
                (payload) => {
                    const newMsg = payload.new as ChatMessage
                    setMessages(prev => [...prev, newMsg])

                    // Play sound if message is from someone else
                    if (newMsg.user_id !== user?.id?.toString()) {
                        playReceiveSound()
                    }
                }
            )
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const typing: TypingUser[] = []

                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.typing && p.user_id !== user?.id) {
                            typing.push({
                                user_id: p.user_id,
                                user_name: p.user_name,
                                user_avatar: p.user_avatar
                            })
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
        if (!channelRef.current || !user || supabase.supabaseUrl.includes('placeholder')) return

        channelRef.current.track({
            typing: true,
            user_id: user.id,
            user_name: user.name,
            user_avatar: user.avatar
        })

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        typingTimeoutRef.current = setTimeout(() => {
            channelRef.current.track({
                typing: false,
                user_id: user.id,
                user_name: user.name,
                user_avatar: user.avatar
            })
        }, 1500)
    }

    const handleSend = async () => {
        if (!newMessage.trim() || !user || supabase.supabaseUrl.includes('placeholder')) return

        const msgContent = newMessage.trim()
        setNewMessage('') // Optimistic clear

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Play Send Sound
        playSendSound()

        // Remove typing status immediately
        if (channelRef.current) {
            channelRef.current.track({
                typing: false,
                user_id: user.id,
                user_name: user.name,
                user_avatar: user.avatar
            })
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

    // Check for missing config
    if (supabase.supabaseUrl.includes('placeholder')) {
        return (
            <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center p-6 text-center bg-white dark:bg-black">
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
        <div className="flex flex-col h-[calc(100vh-64px)] relative bg-white dark:bg-black">

            {/* --- HEADER --- */}
            <header className="flex-none h-14 border-b border-gray-100 dark:border-white/10 px-4 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                        <MessageCircle size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold leading-tight">Public Chat</h1>
                        <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                Live • {messages.length} msgs
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-[10px] font-medium text-gray-400 border border-gray-100 dark:border-white/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock size={10} /> 4h TTL
                </div>
            </header>

            {/* --- MESSAGES AREA --- */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full text-gray-400 text-sm animate-pulse">
                        Loading conversation...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 opacity-50">
                        <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-900">
                            <MessageCircle size={24} />
                        </div>
                        <p>No messages yet. Be the first!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-2">
                        {messages.map((msg) => {
                            const isMe = msg.user_id === user?.id?.toString()
                            return (
                                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                                    <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                        {/* Avatar */}
                                        <div className={`
                                            flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-1 overflow-hidden
                                            ${isMe ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-200'}
                                        `}>
                                            {msg.user_avatar ? (
                                                <img src={msg.user_avatar} alt={msg.user_name} className="w-full h-full object-cover" />
                                            ) : (
                                                msg.user_name?.charAt(0) || '?'
                                            )}
                                        </div>

                                        {/* Content Bubble */}
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                                    {isMe ? 'You' : msg.user_name}
                                                </span>
                                                <span className="text-[10px] text-gray-300 dark:text-gray-600">
                                                    {formatTime(msg.created_at)}
                                                </span>
                                            </div>

                                            <div className={`
                                                px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm rounded-2xl
                                                ${isMe
                                                    ? 'bg-black text-white rounded-tr-sm dark:bg-white dark:text-black font-medium'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm dark:bg-gray-900 dark:border-white/10 dark:text-gray-100'}
                                            `}>
                                                <ReactMarkdown className="prose prose-sm max-w-none break-words [&_*]:text-inherit">
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Typing Indicator Bubbles (In-stream) */}
                        <AnimatePresence>
                            {typingUsers.map((typingUser) => (
                                <motion.div
                                    key={`typing-${typingUser.user_id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex w-full justify-start"
                                >
                                    <div className="flex gap-2 max-w-[85%] md:max-w-[70%] flex-row">
                                        {/* Avatar for Typing User */}
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-1 overflow-hidden bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
                                            {typingUser.user_avatar ? (
                                                <img src={typingUser.user_avatar} alt={typingUser.user_name} className="w-full h-full object-cover" />
                                            ) : (
                                                typingUser.user_name?.charAt(0) || '?'
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-1">
                                                {typingUser.user_name} is typing...
                                            </span>
                                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl rounded-tl-sm px-3 py-2.5 h-[38px]">
                                                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-100"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-200"></span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* --- FOOTER (Input Area) --- */}
            <footer className="flex-none bg-white dark:bg-[#050505] border-t border-gray-100 dark:border-white/10 z-20 pb-[env(safe-area-inset-bottom)]">
                <div className="p-3">
                    <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-white/5 rounded-[1.5rem] p-1.5 transition-all focus-within:ring-1 focus-within:ring-black/10 dark:focus-within:ring-white/10">

                        {!user && (
                            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-[1.5rem]">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Sign in to chat
                                </span>
                            </div>
                        )}

                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value)
                                handleTyping()
                                e.target.style.height = 'auto'
                                e.target.style.height = `${e.target.scrollHeight}px`
                            }}
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
                            disabled={!newMessage.trim() || !user}
                            className={`
                                flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all mb-1 mr-1
                                ${!newMessage.trim() || !user
                                    ? 'bg-gray-300 text-gray-500 dark:bg-white/10 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-black text-white hover:scale-105 active:scale-95 dark:bg-white dark:text-black shadow-sm'}
                            `}
                        >
                            <Send size={14} className={newMessage.trim() ? "ml-0.5" : ""} />
                        </button>
                    </div>
                    <div className="text-[10px] text-center text-gray-300 dark:text-gray-700 mt-1">
                        Messages are public and disappear after 4 hours.
                    </div>
                </div>
            </footer>
        </div>
    )
}
