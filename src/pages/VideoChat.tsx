import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Video, Mic, MicOff, VideoOff, SkipForward, AlertCircle, Loader2, StopCircle, User, Maximize, Minimize, Wifi, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Optimized WebRTC Config
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    iceCandidatePoolSize: 10, // Pre-fetch candidates for speed
}

type ConnectionStatus = 'idle' | 'searching' | 'connecting' | 'connected' | 'error'

export default function VideoChat() {
    const { user } = useAuth()

    // UI State
    const [status, setStatus] = useState<ConnectionStatus>('idle')
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [debugInfo, setDebugInfo] = useState('')

    // Mutable Refs (State that doesn't trigger re-renders)
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const peerRef = useRef<RTCPeerConnection | null>(null)
    const signalChannelRef = useRef<any>(null)
    const queueSubscriptionRef = useRef<any>(null)

    // Search & Session Control
    const isSearchingRef = useRef(false)
    const myQueueIdRef = useRef<string | null>(null)
    const currentSessionIdRef = useRef<string | null>(null)
    const heartbeatRef = useRef<number | null>(null)

    // --- 1. MEDIA SETUP (Optimized) ---

    const initMedia = async () => {
        if (localStream) return localStream;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: { echoCancellation: true, noiseSuppression: true }
            })
            setLocalStream(stream)
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
            }
            return stream
        } catch (err: any) {
            console.error("Media Error:", err)
            setStatus('error')
            setErrorMsg(`Could not access camera/microphone: ${err.message}`)
            return null
        }
    }

    // --- 2. CLEANUP UTILS ---

    const cleanupConnection = useCallback(async () => {
        // Stop Search
        isSearchingRef.current = false;
        if (heartbeatRef.current) clearInterval(heartbeatRef.current)

        // Close Peer
        if (peerRef.current) {
            peerRef.current.ontrack = null
            peerRef.current.onicecandidate = null
            peerRef.current.close()
            peerRef.current = null
        }

        // Remove Channels
        if (signalChannelRef.current) {
            await supabase.removeChannel(signalChannelRef.current)
            signalChannelRef.current = null
        }
        if (queueSubscriptionRef.current) {
            await supabase.removeChannel(queueSubscriptionRef.current)
            queueSubscriptionRef.current = null
        }

        // Clean DB
        if (myQueueIdRef.current && user) {
            await supabase.from('video_chat_queue').delete().eq('id', myQueueIdRef.current)
            myQueueIdRef.current = null
        }

        // UI Reset
        setRemoteStream(null)
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
        currentSessionIdRef.current = null
    }, [user])

    const handleStop = async () => {
        setStatus('idle')
        await cleanupConnection()
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop())
            setLocalStream(null)
        }
    }

    const handleSkip = async () => {
        setStatus('searching') // Keep UI in searching mode
        setRemoteStream(null)
        await cleanupConnection()

        // Instant restart
        // Small delay to allow DB propagation/cleanup
        setTimeout(() => startMatchingProcess(), 50)
    }

    // --- 3. MATCHING LOGIC (The Core Fix) ---

    const startMatchingProcess = async () => {
        if (!user) return
        setErrorMsg('')
        setDebugInfo('Initializing media...')

        // 1. Get Media First (Parallel)
        const stream = await initMedia()
        if (!stream) return

        setStatus('searching')
        isSearchingRef.current = true
        setDebugInfo('Joining queue...')

        try {
            // 2. Clean old entries to prevent ghosting
            await supabase.from('video_chat_queue').delete().eq('user_id', user.id)

            // 3. Insert Self (Passive Mode)
            const { data: queueEntry, error } = await supabase
                .from('video_chat_queue')
                .insert({ user_id: user.id, status: 'waiting' }) // Ensure your DB accepts this
                .select()
                .single()

            if (error || !queueEntry) throw new Error("Queue join failed: " + error.message)
            myQueueIdRef.current = queueEntry.id

            // 4. Start Heartbeat (Keep alive)
            heartbeatRef.current = window.setInterval(async () => {
                if (myQueueIdRef.current) {
                    await supabase.from('video_chat_queue')
                        .update({ updated_at: new Date().toISOString() })
                        .eq('id', myQueueIdRef.current)
                }
            }, 2000)

            // 5. Subscribe to Self (To know if WE get picked)
            const myChannel = supabase.channel(`queue-${queueEntry.id}`)
            queueSubscriptionRef.current = myChannel

            myChannel.on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'video_chat_queue',
                filter: `id=eq.${queueEntry.id}`
            }, (payload) => {
                if (payload.new.matched_with && isSearchingRef.current) {
                    // WE WERE PICKED!
                    setDebugInfo('Matched! Connecting (Passive)...')
                    isSearchingRef.current = false // Stop searching
                    // The sessionId is OUR queue ID because the Caller joined US
                    initiateWebRTC(payload.new.matched_with, queueEntry.id, false)
                }
            }).subscribe()

            // 6. Actively Search for Others (The "Fast" Loop)
            searchLoop()

        } catch (e: any) {
            console.error(e)
            setErrorMsg(`Connection error: ${e.message || "Unknown error"}`)
            setStatus('error')
        }
    }

    const searchLoop = async () => {
        if (!isSearchingRef.current || !user) return

        // Look for anyone who is NOT me, NOT matched, and recently active
        const { data: candidates } = await supabase
            .from('video_chat_queue')
            .select('*')
            .neq('user_id', user.id)
            .is('matched_with', null)
            .gt('updated_at', new Date(Date.now() - 5000).toISOString()) // Alive in last 5s
            .limit(1)

        if (candidates && candidates.length > 0) {
            const target = candidates[0]

            // Atomic Lock: Try to write OUR ID into THEIR row
            const { error } = await supabase
                .from('video_chat_queue')
                .update({ matched_with: user.id })
                .eq('id', target.id)
                .is('matched_with', null) // Optimistic concurrency control

            if (!error) {
                // SUCCESS! We claimed them.
                setDebugInfo('Found partner! Connecting (Active)...')
                isSearchingRef.current = false
                // Session ID is THEIR queue ID (we are visiting them)
                initiateWebRTC(target.user_id, target.id, true)
                return
            }
        }

        // Retry faster (recursive with minimal delay)
        if (isSearchingRef.current) {
            setTimeout(searchLoop, 500) // 500ms poll is aggressive but safe
        }
    }

    // --- 4. WEB RTC LOGIC (Robust) ---

    const initiateWebRTC = (partnerId: string, sessionId: string, isCaller: boolean) => {
        setStatus('connecting')
        currentSessionIdRef.current = sessionId

        // Cleanup previous peer
        if (peerRef.current) peerRef.current.close()

        const peer = new RTCPeerConnection(RTC_CONFIG)
        peerRef.current = peer

        // Add Tracks
        if (localStream) {
            localStream.getTracks().forEach(track => peer.addTrack(track, localStream))
        }

        // Handle Remote Stream
        peer.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0])
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0]
                }
                setStatus('connected') // WE ARE LIVE
            }
        }

        // Signaling Channel
        const channel = supabase.channel(`session-${sessionId}`)
        signalChannelRef.current = channel

        // ICE Candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'candidate',
                    payload: { candidate: event.candidate, from: user?.id }
                })
            }
        }

        // Connection State Monitoring
        peer.onconnectionstatechange = () => {
            // FIX: Only fail on 'failed', ignore 'disconnected' for mobile stability
            if (peer.connectionState === 'failed') {
                // Auto-reconnect or skip
                if (status === 'connected') handleSkip()
            }
        }

        // Signal Listeners
        channel
            .on('broadcast', { event: 'candidate' }, ({ payload }) => {
                if (peer && payload.from !== user?.id && payload.candidate) {
                    peer.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(e => console.warn(e))
                }
            })
            .on('broadcast', { event: 'sdp' }, async ({ payload }) => {
                if (!peer || payload.from === user?.id) return

                const sdp = payload.sdp

                try {
                    if (sdp.type === 'offer') {
                        // Received Offer (Answerer)
                        await peer.setRemoteDescription(new RTCSessionDescription(sdp))
                        const answer = await peer.createAnswer()
                        await peer.setLocalDescription(answer)
                        channel.send({
                            type: 'broadcast',
                            event: 'sdp',
                            payload: { sdp: answer, from: user?.id }
                        })
                    } else if (sdp.type === 'answer') {
                        // Received Answer (Caller)
                        await peer.setRemoteDescription(new RTCSessionDescription(sdp))
                    }
                } catch (err) {
                    console.error("SDP Error", err)
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Logic: Caller creates offer immediately once channel is open
                    if (isCaller) {
                        const offer = await peer.createOffer()
                        await peer.setLocalDescription(offer)
                        channel.send({
                            type: 'broadcast',
                            event: 'sdp',
                            payload: { sdp: offer, from: user?.id }
                        })
                    }
                }
            })
    }


    // --- 5. RENDER ---

    return (
        <div className="flex flex-col h-[100dvh] bg-black text-white font-sans relative overflow-hidden">

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto flex items-center gap-2">
                    <Zap size={16} className={status === 'connected' ? 'text-green-400 fill-current' : 'text-neutral-500'} />
                    <span className="font-bold text-sm tracking-wide">
                        {status === 'idle' && "Ready"}
                        {status === 'searching' && "Scanning..."}
                        {status === 'connecting' && "Establishing..."}
                        {status === 'connected' && "Connected"}
                    </span>
                </div>

                <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 pointer-events-auto transition-colors"
                >
                    {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
            </header>

            {/* Debug (Tiny bottom left) */}
            <div className="absolute bottom-4 left-4 z-10 text-[10px] text-white/30 font-mono pointer-events-none">
                {debugInfo}
            </div>

            {/* Main Stage */}
            <main className="flex-1 relative flex items-center justify-center bg-neutral-900">

                {/* REMOTE VIDEO */}
                <div className="absolute inset-0 w-full h-full">
                    {status === 'connected' || status === 'connecting' ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 relative overflow-hidden">
                            {/* Animated Background */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-black to-black animate-pulse" />

                            {status === 'searching' ? (
                                <div className="z-10 flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-ping" />
                                        <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center border border-white/10 relative z-10">
                                            <Loader2 size={40} className="text-blue-500 animate-spin" />
                                        </div>
                                    </div>
                                    <p className="text-neutral-400 font-medium animate-pulse">Finding a partner...</p>
                                </div>
                            ) : status === 'error' ? (
                                <div className="text-center px-6">
                                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
                                    <p className="text-neutral-400 mb-6">{errorMsg}</p>
                                    <button
                                        onClick={() => handleSkip()}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center z-10 px-4">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900/20 rotate-3">
                                        <User size={40} className="text-white" />
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                                        Random Chat
                                    </h1>
                                    <p className="text-neutral-400 mb-8 max-w-xs mx-auto">
                                        Click start to find a random student instantly.
                                    </p>
                                    <button
                                        onClick={startMatchingProcess}
                                        className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                                    >
                                        <span className="flex items-center gap-2">
                                            Start Matching <SkipForward size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SELF VIDEO (Draggable/Floating feel) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: localStream ? 1 : 0, scale: 1 }}
                    className="absolute top-20 right-4 w-[100px] md:w-[140px] aspect-[3/4] bg-neutral-800 rounded-xl overflow-hidden border border-white/20 shadow-2xl z-30"
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : ''}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 text-neutral-500" hidden={!isVideoOff}>
                        <VideoOff size={24} />
                    </div>
                </motion.div>

                {/* CONTROLS */}
                {status !== 'idle' && status !== 'error' && (
                    <div className="absolute bottom-8 z-40 flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-full border border-white/10">
                            <button
                                onClick={() => {
                                    if (localStream) {
                                        localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled)
                                        setIsMuted(!isMuted)
                                    }
                                }}
                                className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-white'}`}
                            >
                                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>

                            <button
                                onClick={() => {
                                    if (localStream) {
                                        localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled)
                                        setIsVideoOff(!isVideoOff)
                                    }
                                }}
                                className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-white'}`}
                            >
                                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                            </button>

                            <button
                                onClick={handleStop}
                                className="p-4 rounded-full hover:bg-red-500/20 text-red-500 transition-all"
                            >
                                <StopCircle size={24} />
                            </button>
                        </div>

                        <button
                            onClick={handleSkip}
                            disabled={status === 'searching'}
                            className={`h-[64px] px-8 rounded-full font-bold text-lg flex items-center gap-2 transition-all shadow-lg
                                ${status === 'searching'
                                    ? 'bg-neutral-800 text-neutral-500 cursor-wait'
                                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-blue-500/30'
                                }`}
                        >
                            Next <SkipForward size={24} />
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}