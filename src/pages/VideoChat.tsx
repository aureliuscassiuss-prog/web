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
                        <div className="flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
                            {status === 'searching' ? (
                                <div className="mb-8 relative">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping blur-xl" />
                                    <div className="relative w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                                        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                                    </div>
                                    <div className="mt-8 space-y-2">
                                        <h3 className="text-2xl font-bold">Looking for someone...</h3>
                                        <p className="text-neutral-400">Finding the perfect match for you.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-[2rem] flex items-center justify-center mx-auto border border-white/10 rotate-3 transform transition-transform hover:rotate-6">
                                        <User size={64} className="text-blue-400" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                                            Meet Random People
                                        </h2>
                                        <p className="text-lg text-neutral-400 leading-relaxed">
                                            Connect instantly with students from your campus.
                                            <br className="hidden md:block" />Safe, anonymous, and fun.
                                        </p>
                                    </div>
                                    <button
                                        onClick={startSearch}
                                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-white/10 overflow-hidden"
                                    >
                                        <span className="relative z-10">Start Matching</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                                        <SkipForward className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* LOCAL VIDEO (PIP) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-8 right-8 w-36 sm:w-48 aspect-[3/4] sm:aspect-video bg-neutral-800 rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-30"
                >
                    {localStream ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : ''}`}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-500 gap-2">
                            <VideoOff className="w-6 h-6" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Camera Off</span>
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                        {isMuted && (
                            <div className="w-6 h-6 bg-red-500/90 rounded-full flex items-center justify-center text-white shadow-sm backdrop-blur-md">
                                <MicOff size={12} />
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
                            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
                        >
                            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl shadow-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1 text-sm">
                                    <p className="font-semibold text-red-500 mb-1">Connection Error</p>
                                    <p className="opacity-90 leading-snug">{errorMsg}</p>
                                    <button
                                        onClick={() => { setErrorMsg(''); startSearch(); }}
                                        className="mt-3 text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            {/* CONTROLS BAR (Floating) */}
            <div className="pb-8 pt-4 px-4 flex justify-center sticky bottom-0 z-40">
                <div className="flex items-center gap-4 bg-neutral-900/80 backdrop-blur-xl p-2.5 rounded-full border border-white/5 shadow-2xl">

                    {status !== 'idle' ? (
                        <>
                            <ControlBtn
                                onClick={toggleMute}
                                active={isMuted}
                                icon={isMuted ? MicOff : Mic}
                                activeClass="bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            />
                            <ControlBtn
                                onClick={toggleVideo}
                                active={isVideoOff}
                                icon={isVideoOff ? VideoOff : Video}
                                activeClass="bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            />

                            <div className="w-px h-8 bg-white/10 mx-2" />

                            <button
                                onClick={handleStop}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                                title="Stop Connection"
                            >
                                <StopCircle size={20} fill="currentColor" className="opacity-50" />
                            </button>

                            <button
                                onClick={handleSkip}
                                className="h-12 px-6 rounded-full bg-white text-black font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                <SkipForward size={18} />
                                <span>Next Person</span>
                            </button>
                        </>
                    ) : (
                        <div className="px-4 py-2 text-sm text-neutral-500 font-medium">
                            Ready to start matching
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ControlBtn({ onClick, active, icon: Icon, activeClass }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${active
                    ? activeClass
                    : 'bg-neutral-800 text-white/90 hover:bg-neutral-700 hover:scale-110'
                }`}
        >
            <Icon size={20} />
        </button>
    )
}
