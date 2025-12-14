import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Video, Mic, MicOff, VideoOff, SkipForward, AlertCircle, Loader2, StopCircle, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// WebRTC Configuration
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
}

export default function VideoChat() {
    const { user } = useAuth()
    const [status, setStatus] = useState<'idle' | 'searching' | 'connected' | 'error'>('idle')
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null) // Used for state tracking, mainly
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [partnerStatus, setPartnerStatus] = useState<'connecting' | 'connected'>('connecting')

    // Refs for persistence without re-renders
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const peerRef = useRef<RTCPeerConnection | null>(null)
    const queueSubscriptionRef = useRef<any>(null)
    const signalChannelRef = useRef<any>(null)
    const myQueueIdRef = useRef<string | null>(null)

    // Track if we have already sent an offer to avoid dups
    const hasSentOfferRef = useRef(false)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handleStop()
        }
    }, [])

    // Initialize Local Stream
    const initLocalStream = async () => {
        try {
            console.log("Requesting permissions...")
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: true
            })
            console.log("Permissions granted.")
            setLocalStream(stream)
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
                // Important for mobile to play video
                localVideoRef.current.play().catch(e => console.error("Local video play error:", e))
            }
            setErrorMsg('')
            return stream
        } catch (err: any) {
            console.error("Camera error:", err)
            setStatus('error')

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setErrorMsg('Permissions denied. Please reset permissions in your browser settings.')
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setErrorMsg('No camera or microphone found.')
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setErrorMsg('Camera/Mic is being used by another app.')
            } else {
                setErrorMsg(`Could not access device: ${err.message || 'Unknown error'}`)
            }
            return null
        }
    }

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled)
            setIsMuted(!isMuted)
        }
    }

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
            setIsVideoOff(!isVideoOff)
        }
    }

    // --- RTC LOGIC ---

    const createPeer = (isCaller: boolean, signalChannel: any) => {
        // Close existing peer if any
        if (peerRef.current) {
            peerRef.current.close()
        }

        const peer = new RTCPeerConnection(RTC_CONFIG)
        peerRef.current = peer

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => peer.addTrack(track, localStream))
        }

        // Handle remote tracks
        peer.ontrack = (event) => {
            console.log("Remote track received")
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0])
                setPartnerStatus('connected')
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0]
                    remoteVideoRef.current.play().catch(e => console.error("Remote play error", e))
                }
            }
        }

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                signalChannel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { type: 'candidate', candidate: event.candidate }
                })
            }
        }

        peer.onconnectionstatechange = () => {
            console.log("Connection state:", peer.connectionState)
            if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
                setStatus('idle')
                setRemoteStream(null)
            }
            if (peer.connectionState === 'connected') {
                setPartnerStatus('connected')
            }
        }

        return peer
    }

    // --- MATCHING LOGIC ---

    const startSearch = async () => {
        if (!user) return
        setErrorMsg('')
        hasSentOfferRef.current = false
        setPartnerStatus('connecting')

        let stream = localStream
        if (!stream) {
            stream = await initLocalStream()
            if (!stream) return
        }

        setStatus('searching')

        // 1. Check queue for partner
        const { data: candidates, error } = await supabase
            .from('video_chat_queue')
            .select('*')
            .neq('user_id', user.id)
            .is('matched_with', null)
            .limit(1)

        if (error) console.error("Queue check error", error)

        if (candidates && candidates.length > 0) {
            const target = candidates[0]
            console.log("Found partner:", target.user_id)

            // 2. Try to CLAIM this user
            const { error: claimError } = await supabase
                .from('video_chat_queue')
                .update({ matched_with: user.id })
                .eq('id', target.id)
                .is('matched_with', null)

            if (!claimError) {
                // SUCCESS: We are the CALLER
                console.log("Claimed partner. Acting as CALLER.")
                initiateCall(target.id, true)
                return
            }
        }

        // 3. No one found -> Join Queue (as CALLEE)
        addToQueue()
    }

    const addToQueue = async () => {
        if (!user) return

        // Insert self or update existing
        const { data, error } = await supabase
            .from('video_chat_queue')
            .upsert({ user_id: user.id }, { onConflict: 'user_id' })
            .select()
            .single()

        if (error) {
            console.error("Join queue error:", error)
            setErrorMsg("Failed to join queue.")
            setStatus('error')
            return
        }

        myQueueIdRef.current = data.id

        // 4. Subscribe to MY row
        if (!myQueueIdRef.current) return

        const channel = supabase.channel(`queue-${myQueueIdRef.current}`)
        queueSubscriptionRef.current = channel

        channel
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'video_chat_queue',
                    filter: `id=eq.${myQueueIdRef.current}`
                },
                (payload) => {
                    if (payload.new.matched_with) {
                        console.log("Picked by:", payload.new.matched_with)
                        initiateCall(myQueueIdRef.current!, false)
                    }
                }
            )
            .subscribe()
    }

    const initiateCall = async (sessionId: string, isCaller: boolean) => {
        console.log(`Starting call. Session: ${sessionId}, I am Caller: ${isCaller}`)
        hasSentOfferRef.current = false

        // Initialize Signaling Channel
        const channel = supabase.channel(`video-session-${sessionId}`)
        signalChannelRef.current = channel

        const peer = createPeer(isCaller, channel)

        channel
            .on('broadcast', { event: 'signal' }, async ({ payload }) => {
                if (!peerRef.current) return

                console.log("Received signal:", payload.type)

                if (payload.type === 'offer' && !isCaller) {
                    await peerRef.current.setRemoteDescription(payload.offer)
                    const answer = await peerRef.current.createAnswer()
                    await peerRef.current.setLocalDescription(answer)
                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { type: 'answer', answer }
                    })
                } else if (payload.type === 'answer' && isCaller) {
                    await peerRef.current.setRemoteDescription(payload.answer)
                } else if (payload.type === 'candidate') {
                    await peerRef.current.addIceCandidate(payload.candidate)
                }
            })
            // Presence tracking to fix Race Condition
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const presenceIds = Object.keys(state)
                console.log("Presence sync:", presenceIds.length)

                // If I am Caller, and I see SOMEONE ELSE is here, I can send Offer
                if (isCaller && presenceIds.length > 1 && !hasSentOfferRef.current) {
                    console.log("Peer present! Sending Offer...")
                    sendOffer(peer, channel)
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track my presence so the other person knows I'm here
                    await channel.track({ user_id: user?.id })
                }
            })

        setStatus('connected')
    }

    const sendOffer = async (peer: RTCPeerConnection, channel: any) => {
        if (hasSentOfferRef.current) return
        hasSentOfferRef.current = true

        try {
            const offer = await peer.createOffer()
            await peer.setLocalDescription(offer)
            channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { type: 'offer', offer }
            })
        } catch (e) {
            console.error("Error creating offer:", e)
        }
    }

    // --- STOP / SKIP ---

    const handleStop = async () => {
        setStatus('idle')
        setRemoteStream(null)
        setPartnerStatus('connecting')

        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

        if (peerRef.current) {
            peerRef.current.close()
            peerRef.current = null
        }

        if (signalChannelRef.current) {
            supabase.removeChannel(signalChannelRef.current)
            signalChannelRef.current = null
        }
        if (queueSubscriptionRef.current) {
            supabase.removeChannel(queueSubscriptionRef.current)
            queueSubscriptionRef.current = null
        }

        if (user) {
            await supabase.from('video_chat_queue').delete().eq('user_id', user.id)
        }
        myQueueIdRef.current = null
    }

    const handleSkip = async () => {
        await handleStop()
        // Small delay to ensure DB cleanup propagates if needed, though cleanup is fire-and-forget
        setTimeout(() => startSearch(), 500)
    }

    // --- RENDER ---

    return (
        <div className="flex flex-col h-[100dvh] bg-neutral-950 text-white overflow-hidden font-sans relative">

            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-neutral-950 to-neutral-950 z-0 pointer-events-none" />

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 z-10 sticky top-0 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Video size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">VideoChat</h1>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
                            <span className="text-xs text-neutral-400 font-medium">
                                {status === 'searching' && "Matching..."}
                                {status === 'connected' && (partnerStatus === 'connected' ? "Live Connection" : "Connecting...")}
                                {status === 'idle' && "180+ Online"}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Video Area */}
            <main className="flex-1 relative flex items-center justify-center p-4 z-0">

                {/* REMOTE VIDEO CONTAINER */}
                <div className="relative w-full h-full max-w-5xl bg-neutral-900/50 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl flex items-center justify-center">

                    {status === 'connected' ? (
                        <>
                            {/* Video Element */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain"
                            />

                            {/* Connecting State Overlay */}
                            {partnerStatus === 'connecting' && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                        <p className="text-neutral-300 font-medium">Connecting to partner...</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* IDLE / SEARCHING STATE */
                        <div className="flex flex-col items-center justify-center text-center p-6 w-full max-w-md mx-auto z-10">
                            {status === 'searching' ? (
                                <div className="relative py-12">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full animate-ping [animation-duration:3s]" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 rounded-full animate-ping [animation-duration:2s]" />

                                    <div className="relative w-24 h-24 bg-neutral-900/80 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                                    </div>
                                    <div className="mt-8 space-y-1 relative z-20">
                                        <h3 className="text-xl font-bold">Matching...</h3>
                                        <p className="text-neutral-400 text-sm">Finding a student for you</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto border border-white/10 rotate-3 shadow-2xl">
                                        <User size={40} className="text-blue-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                                            Random Chat
                                        </h2>
                                        <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                                            Connect instantly with students. Safe & Anonymous.
                                        </p>
                                    </div>
                                    <button
                                        onClick={startSearch}
                                        className="w-full py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                                    >
                                        <span>Start Matching</span>
                                        <SkipForward className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* LOCAL VIDEO (PIP) - Fixed Visibility */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-20 right-4 w-[28vw] max-w-[120px] aspect-[3/4] bg-neutral-800 rounded-xl overflow-hidden border border-white/20 shadow-2xl z-30 pointer-events-none"
                >
                    {/* Added z-30 and checks for localStream */}
                    {localStream ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : ''}`}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-500 gap-1">
                            <VideoOff className="w-5 h-5" />
                        </div>
                    )}

                    <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                        {isMuted && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm">
                                <MicOff size={10} />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ERROR TOAST */}
                <AnimatePresence>
                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-4 right-4 z-50 mx-auto max-w-sm"
                        >
                            <div className="bg-red-950/90 backdrop-blur border border-red-500/30 text-red-200 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <div className="flex-1 text-sm">
                                    <p className="font-medium text-red-400">{errorMsg}</p>
                                </div>
                                <button
                                    onClick={() => { setErrorMsg(''); startSearch(); }}
                                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                                >
                                    <Loader2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            {/* CONTROLS BAR (Overlay) */}
            <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3 md:gap-4 bg-neutral-950/80 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl shadow-black/50">

                    {status !== 'idle' ? (
                        <>
                            {/* Mute Box */}
                            <button
                                onClick={toggleMute}
                                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            {/* Video Box */}
                            <button
                                onClick={toggleVideo}
                                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                            </button>

                            {/* Divider */}
                            <div className="w-px h-6 bg-white/10 mx-1" />

                            {/* Stop (Small) */}
                            <button
                                onClick={handleStop}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                                <StopCircle size={24} />
                            </button>

                            {/* Skip (Large Pill) */}
                            <button
                                onClick={handleSkip}
                                className="h-12 md:h-14 px-6 md:px-8 rounded-full bg-blue-600 text-white font-bold flex items-center gap-2 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
                            >
                                <span className="hidden md:inline text-lg">Next</span>
                                <SkipForward size={24} />
                            </button>
                        </>
                    ) : (
                        <div className="px-6 py-3 text-sm text-neutral-400 font-medium">
                            Ready
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


