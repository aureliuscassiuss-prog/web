import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Video, Mic, MicOff, VideoOff, SkipForward, AlertCircle, Loader2, StopCircle, User, Maximize, Minimize, WifiOff, Bug } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'

// WebRTC Configuration
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
}

export default function VideoChat() {
    const { user } = useAuth()
    const [status, setStatus] = useState<'idle' | 'searching' | 'connected' | 'reconnecting' | 'error'>('idle')
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [partnerStatus, setPartnerStatus] = useState<'connecting' | 'connected'>('connecting')
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [showDebug, setShowDebug] = useState(false)
    const [debugLogs, setDebugLogs] = useState<string[]>([])

    // Refs for persistence without re-renders
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const peerRef = useRef<RTCPeerConnection | null>(null)
    const queueSubscriptionRef = useRef<any>(null)
    const signalChannelRef = useRef<any>(null)
    const myQueueIdRef = useRef<string | null>(null)

    // Session Integrity
    const sessionIdRef = useRef<string | null>(null)
    const leaveTimeoutRef = useRef<number | null>(null)

    // ICE Candidate Buffer to fix race conditions
    const iceCandidatesBuffer = useRef<RTCIceCandidate[]>([])

    // Track if we have already sent an offer to avoid dups
    const hasSentOfferRef = useRef(false)

    // Connection timeout ref
    const connectionTimeoutRef = useRef<number | null>(null)
    const heartbeatIntervalRef = useRef<number | null>(null)

    // Status ref for callbacks
    const statusRef = useRef(status)
    useEffect(() => { statusRef.current = status }, [status])

    // Logging helper
    const log = (msg: string) => {
        console.log(msg)
        setDebugLogs(prev => [msg, ...prev].slice(0, 20))
    }

    // Ensure local video is attached when stream is ready
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream
            localVideoRef.current.play().catch(e => console.error("Local video play error:", e))
        }
    }, [localStream])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handleStop(true) // Send bye on unmount
        }
    }, [])

    // Initialize Local Stream
    const initLocalStream = async () => {
        try {
            log("Requesting permissions...")
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: true
            })
            log("Permissions granted.")
            setLocalStream(stream)
            setErrorMsg('')
            return stream
        } catch (err: any) {
            console.error("Camera error:", err)
            setStatus('error')
            log(`Camera error: ${err.name}`)

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setErrorMsg('Permissions denied. Please reset permissions in your browser settings.')
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setErrorMsg('No camera or microphone found.')
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setErrorMsg('Camera/Mic is being used by another app.')
            } else {
                setErrorMsg(`Could not access device: ${err.message || 'Unknown error'} `)
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

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error enabling fullscreen: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    }

    // --- RTC LOGIC ---

    const createPeer = (signalChannel: any, currentSessionId: string) => {
        // Close existing peer if any
        if (peerRef.current) {
            peerRef.current.close()
        }

        const peer = new RTCPeerConnection(RTC_CONFIG)
        peerRef.current = peer
        iceCandidatesBuffer.current = [] // Reset buffer

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => peer.addTrack(track, localStream))
        }

        // Handle remote tracks
        peer.ontrack = (event) => {
            log("Remote track received")
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0])
                setPartnerStatus('connected')
                setStatus('connected') // Recover from reconnecting
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0]
                    remoteVideoRef.current.play().catch(e => console.error("Remote play error", e))
                }
            }
        }

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                // log("Sent ICE Candidate") // Verbose
                signalChannel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: {
                        type: 'candidate',
                        candidate: event.candidate,
                        sessionId: currentSessionId // Tag with session ID
                    }
                })
            }
        }

        peer.oniceconnectionstatechange = () => {
            const state = peer.iceConnectionState
            log(`ICE State: ${state}`)

            // Robust Handling: Only fail on terminal states
            if (state === 'failed' || state === 'closed') {
                if (statusRef.current === 'connected' || statusRef.current === 'reconnecting') {
                    log("ICE Failed. Restarting...")
                    handleStop()
                    startSearch()
                }
            } else if (state === 'disconnected') {
                // Temporary network glitch - DO NOT SKIP
                log("ICE Disconnected - Attempting to recover...")
                setStatus('reconnecting')
            } else if (state === 'connected' || state === 'completed') {
                if (statusRef.current === 'reconnecting') {
                    log("ICE Recovered!")
                    setStatus('connected')
                }
            }
        }

        peer.onconnectionstatechange = () => {
            const state = peer.connectionState
            log(`Connection state: ${state}`)

            if (state === 'failed') {
                if (statusRef.current === 'connected') {
                    log("Connection failed (terminal). Restarting...")
                    handleStop()
                    startSearch()
                }
            } else if (state === 'connected') {
                setPartnerStatus('connected')
                setStatus('connected')
                // Clear timeout on successful connection
                if (connectionTimeoutRef.current) {
                    clearTimeout(connectionTimeoutRef.current)
                }
            }
        }

        return peer
    }

    // --- MATCHING LOGIC ---

    const startSearch = async () => {
        if (!user) return

        // Reset Logic
        setErrorMsg('')
        hasSentOfferRef.current = false
        setPartnerStatus('connecting')
        iceCandidatesBuffer.current = []
        setDebugLogs([]) // Clear previous logs
        stopPolling() // Safety clear

        let stream = localStream
        if (!stream) {
            stream = await initLocalStream()
            if (!stream) return
        }

        setStatus('searching')
        log("Started searching...")

        // ACTIVE & PASSIVE STRATEGY:
        // 1. Clean up old queue entry first (important!)
        if (user) {
            await supabase.from('video_chat_queue').delete().eq('user_id', user.id)
        }

        // 2. Small delay to ensure DB propagates delete
        await new Promise(resolve => setTimeout(resolve, 200))

        // 3. Put myself in the pool (Passive)
        await addToQueue()

        // 4. Actively look for others (Active)
        startPolling()
    }

    // Polling ref for active searching
    const searchingIntervalRef = useRef<number | null>(null)

    const addToQueue = async () => {
        if (!user) return

        // Insert self or update existing
        const { data, error } = await supabase
            .from('video_chat_queue')
            .upsert({
                user_id: user.id,
                matched_with: null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single()

        if (error) {
            console.error("Join queue error:", error)
            setErrorMsg("Failed to join queue.")
            setStatus('error')
            log("Queue Join Failed")
            return
        }

        myQueueIdRef.current = data.id
        log("Joined queue.")

        // Start Heartbeat (ping every 2s to show liveness)
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = window.setInterval(async () => {
            if (myQueueIdRef.current) {
                await supabase
                    .from('video_chat_queue')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', myQueueIdRef.current)
            }
        }, 2000)

        // Subscribe to MY row to see if I get picked (Passive)
        if (!myQueueIdRef.current) return

        // Clean existing sub
        if (queueSubscriptionRef.current) supabase.removeChannel(queueSubscriptionRef.current)

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
                    // Check if *I* was matched
                    if (payload.new.matched_with && partnerStatus !== 'connected') {
                        log(`Matched by user: ${payload.new.matched_with}`)
                        // If I'm already setting up a call as a caller, this might race, 
                        // but checking partnerStatus helps.
                        if (peerRef.current) return // Already busy with another connection

                        stopPolling()
                        initiateCall(myQueueIdRef.current!, false)
                    }
                }
            )
            .subscribe()
    }

    const startPolling = () => {
        if (searchingIntervalRef.current) clearInterval(searchingIntervalRef.current)

        // Immediate check then interval
        checkForPartner()

        searchingIntervalRef.current = window.setInterval(async () => {
            await checkForPartner()
        }, 2000) // Check every 2s
    }

    const stopPolling = () => {
        if (searchingIntervalRef.current) {
            clearInterval(searchingIntervalRef.current)
            searchingIntervalRef.current = null
        }
    }

    const checkForPartner = async () => {
        if (!user) return

        // 1. Find a candidate (exclude entries less than 2s old to avoid race conditions)
        // AND ensure they are alive (updated_at > 7s ago - generous buffer)
        const twoSecondsAgo = new Date(Date.now() - 2000).toISOString()
        const sevenSecondsAgo = new Date(Date.now() - 7000).toISOString()

        const { data: candidates } = await supabase
            .from('video_chat_queue')
            .select('*')
            .neq('user_id', user.id)
            .is('matched_with', null)
            .lt('created_at', twoSecondsAgo)
            .gt('updated_at', sevenSecondsAgo) // Only match with LIVE users
            .limit(1)

        if (candidates && candidates.length > 0) {
            const target = candidates[0]
            log(`Found target: ${target.user_id}`)

            // 2. Try to CLAIM
            const { error: claimError } = await supabase
                .from('video_chat_queue')
                .update({ matched_with: user.id })
                .eq('id', target.id)
                .is('matched_with', null)
            // .is ensures we only claim if they are STILL free

            if (!claimError) {
                log("Claimed partner successfully")
                stopPolling() // Stop searching
                initiateCall(target.id, true) // Act as Caller
            } else {
                log("Claim failed (taken)")
            }
        }
    }

    const initiateCall = async (sessionId: string, isCaller: boolean) => {
        log(`Init Call. Caller: ${isCaller}`)

        // --- ROBUST SESSION ID ---
        // This ensures events from previous attempts (ghosts) don't interfere
        const currentSessionId = sessionId
        sessionIdRef.current = currentSessionId

        hasSentOfferRef.current = false
        iceCandidatesBuffer.current = []

        // Clear any existing timeout
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current)
        }

        // Set connection timeout - INCREASED TO 30s for Mobile (God-mode reliability)
        connectionTimeoutRef.current = setTimeout(() => {
            // Only trigger if we are still connecting and the session hasn't changed
            if (partnerStatus === 'connecting' && sessionIdRef.current === currentSessionId) {
                log('Timeout (30s) - restarting')
                handleStop()
                setTimeout(() => startSearch(), 500)
            }
        }, 30000)

        // Initialize Signaling Channel
        const channel = supabase.channel(`video-session-${sessionId}`)
        signalChannelRef.current = channel

        const peer = createPeer(channel, currentSessionId)

        channel
            .on('broadcast', { event: 'signal' }, async ({ payload }) => {
                if (!peerRef.current) return

                // GHOST PROTECTION: internal check although channel name is unique,
                // explicit check serves as documentation and double-safety
                if (payload.sessionId && payload.sessionId !== currentSessionId) {
                    console.warn("Ignoring signal from invalid session", payload.sessionId)
                    return
                }

                if (payload.type === 'bye') {
                    log("Peer bye. Restarting...")
                    handleStop()
                    startSearch() // Auto-next
                    return
                }

                if (payload.type === 'offer' && !isCaller) {
                    log("Rx Offer. Sending Answer...")
                    await peerRef.current.setRemoteDescription(payload.offer)
                    const answer = await peerRef.current.createAnswer()
                    await peerRef.current.setLocalDescription(answer)

                    // Flush buffer
                    if (iceCandidatesBuffer.current.length > 0) {
                        log(`Flushing ${iceCandidatesBuffer.current.length} buffered ICE`)
                        iceCandidatesBuffer.current.forEach(c => peerRef.current?.addIceCandidate(c))
                        iceCandidatesBuffer.current = []
                    }

                    channel.send({
                        type: 'broadcast',
                        event: 'signal',
                        payload: { type: 'answer', answer, sessionId: currentSessionId }
                    })
                } else if (payload.type === 'answer' && isCaller) {
                    log("Rx Answer.")
                    await peerRef.current.setRemoteDescription(payload.answer)
                    // Flush buffer
                    if (iceCandidatesBuffer.current.length > 0) {
                        log(`Flushing ${iceCandidatesBuffer.current.length} buffered ICE`)
                        iceCandidatesBuffer.current.forEach(c => peerRef.current?.addIceCandidate(c))
                        iceCandidatesBuffer.current = []
                    }
                } else if (payload.type === 'candidate') {
                    // Basic trickle handling
                    if (peerRef.current.remoteDescription) {
                        await peerRef.current.addIceCandidate(payload.candidate)
                    } else {
                        // log("Buffering ICE candidate")
                        iceCandidatesBuffer.current.push(payload.candidate)
                    }
                }
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                log("Presence Leave")

                // DEBOUNCED LEAVE: Wait 3s to confirm they are really gone
                if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)

                leaveTimeoutRef.current = window.setTimeout(() => {
                    const state = channel.presenceState()
                    // If the only peer left is me (or explicit 0 if I'm not tracked yet), restart
                    if (Object.keys(state).length <= 1 && statusRef.current === 'connected') {
                        log("Presence confirmed leave. Restarting...")
                        handleStop()
                        startSearch()
                    }
                }, 3000)
            })
            // Presence tracking
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const presenceIds = Object.keys(state)
                // log(`Presence sync: ${presenceIds.length}`)

                // If presence returns, cancel the leave timeout!
                if (presenceIds.length > 1 && leaveTimeoutRef.current) {
                    log("Peer returned! Cancel leave.")
                    clearTimeout(leaveTimeoutRef.current)
                    leaveTimeoutRef.current = null
                }

                // If I am Caller, and I see SOMEONE ELSE is here, I can send Offer
                if (isCaller && presenceIds.length > 1 && !hasSentOfferRef.current) {
                    log("Peer present! Sending Offer...")
                    sendOffer(peer, channel, currentSessionId)
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

    const sendOffer = async (peer: RTCPeerConnection, channel: any, currentSessionId: string) => {
        if (hasSentOfferRef.current) return
        hasSentOfferRef.current = true

        try {
            const offer = await peer.createOffer()
            await peer.setLocalDescription(offer)
            channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { type: 'offer', offer, sessionId: currentSessionId }
            })
        } catch (e) {
            console.error("Error creating offer:", e)
        }
    }

    // --- STOP / SKIP ---

    const handleStop = async (sendBye = false) => {
        // Send BYE if requested and connected (Fire and forget with small buffer)
        if (sendBye && signalChannelRef.current && peerRef.current) {
            signalChannelRef.current.send({
                type: 'broadcast',
                event: 'signal',
                // Use current ref
                payload: { type: 'bye', sessionId: sessionIdRef.current }
            }).catch(e => console.error("Error sending bye:", e))

            // Give a tiny moment for the message to hit the network buffer before we tear down
            await new Promise(resolve => setTimeout(resolve, 20))
        }

        setStatus('idle')
        setRemoteStream(null)
        setPartnerStatus('connecting')
        stopPolling() // Stop active search

        // Clear refs
        sessionIdRef.current = null
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current)
            leaveTimeoutRef.current = null
        }

        // Clear connection timeout
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current)
            connectionTimeoutRef.current = null
        }

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

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current)
            heartbeatIntervalRef.current = null
        }

        if (user) {
            await supabase.from('video_chat_queue').delete().eq('user_id', user.id)
        }
        myQueueIdRef.current = null

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop())
            setLocalStream(null)
            if (localVideoRef.current) localVideoRef.current.srcObject = null
        }
    }

    const handleSkip = async () => {
        await handleStop(true) // Send BYE signal
        // Immediate restart (relies on robust queue filters)
        setTimeout(() => startSearch(), 50)
    }

    // --- RENDER ---

    return (
        <div className="flex flex-col h-[100dvh] bg-white dark:bg-black text-neutral-900 dark:text-white overflow-hidden font-sans relative">

            {/* Header (Minimal) */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto bg-white/50 dark:bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-neutral-200 dark:border-white/10 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center">
                        <Video size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-bold text-sm md:text-base pr-3">VideoChat</span>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* DEBUG BUTTON */}
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="p-2 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-neutral-200 dark:border-white/10 hover:opacity-80 transition-all shadow-sm"
                    >
                        <Bug size={18} className={showDebug ? "text-blue-500" : "text-neutral-500"} />
                    </button>

                    <button
                        onClick={toggleFullScreen}
                        className="p-2 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-neutral-200 dark:border-white/10 hover:scale-105 active:scale-95 transition-all shadow-sm"
                    >
                        {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-neutral-200 dark:border-white/10 shadow-sm">
                        <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-neutral-400 dark:bg-neutral-600'}`} />
                        <span className="text-xs font-medium opacity-80">
                            {status === 'searching' && "Matching..."}
                            {status === 'reconnecting' && "Reconnecting..."}
                            {status === 'connected' && (partnerStatus === 'connected' ? "Live" : "Connecting...")}
                            {status === 'idle' && "Ready"}
                        </span>
                    </div>
                </div>
            </div>

            {/* DEBUG OVERLAY */}
            {showDebug && (
                <div className="absolute top-20 left-4 w-64 h-64 bg-black/80 text-green-400 p-2 text-[10px] font-mono rounded overflow-y-auto z-40 pointer-events-auto border border-green-900/50">
                    <div className="font-bold mb-1 border-b border-green-800 pb-1">Debug Logs</div>
                    {debugLogs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            )}

            {/* Main Video Area - FULL SCREEN */}
            <main className={`flex-1 relative overflow-hidden flex items-center justify-center ${isFullScreen ? 'p-0' : 'p-2 md:p-4'}`}>

                {/* REMOTE VIDEO CONTAINER - Full Bleed */}
                <div className={`w-full h-full flex items-center justify-center relative bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden ${isFullScreen ? 'rounded-none' : 'rounded-3xl'}`}>

                    {status === 'connected' || status === 'reconnecting' ? (
                        <>
                            {/* Video Element */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* RECONNECTING OVERLAY */}
                            {status === 'reconnecting' && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                                    <div className="flex flex-col items-center gap-3 animate-pulse">
                                        <WifiOff className="w-10 h-10 text-yellow-500" />
                                        <p className="text-white font-medium">Reconnecting...</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* IDLE / SEARCHING STATE */
                        <div className="flex flex-col items-center justify-center text-center p-6 w-full max-w-md mx-auto z-10">
                            {status === 'searching' ? (
                                <div className="relative py-12 flex flex-col items-center justify-center">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full animate-ping [animation-duration:3s]" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full animate-ping [animation-duration:2s]" />

                                    <div className="relative w-24 h-24 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center border border-neutral-200 dark:border-white/10 shadow-2xl mx-auto">
                                        <User size={32} className="text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <div className="mt-8 space-y-1 relative z-20">
                                        <h3 className="text-xl font-bold">Matching...</h3>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Finding someone for you</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-blue-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto border border-neutral-200 dark:border-white/10 rotate-3 shadow-2xl">
                                        <User size={40} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-white dark:to-neutral-400">
                                            Random Chat
                                        </h2>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                                            Connect instantly with students. Safe & Anonymous.
                                        </p>
                                    </div>
                                    <button
                                        onClick={startSearch}
                                        className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-neutral-900/10 dark:shadow-white/5 flex items-center justify-center gap-2"
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
                    className="absolute top-20 right-4 w-[28vw] max-w-[120px] aspect-[3/4] bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-300 dark:border-white/20 shadow-2xl z-30"
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
                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-400 gap-1">
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
                            <div className="bg-red-50/90 dark:bg-red-950/90 backdrop-blur border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0" />
                                <div className="flex-1 text-sm">
                                    <p className="font-medium">{errorMsg}</p>
                                </div>
                                <button
                                    onClick={() => { setErrorMsg(''); startSearch(); }}
                                    className="p-1.5 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg text-red-600 dark:text-red-400 transition-colors"
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
                <div className="pointer-events-auto flex items-center gap-3 md:gap-4 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-2 rounded-full border border-neutral-200 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/50">

                    {status !== 'idle' ? (
                        <>
                            {/* Mute Box */}
                            <button
                                onClick={toggleMute}
                                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20'}`}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            {/* Video Box */}
                            <button
                                onClick={toggleVideo}
                                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20'}`}
                            >
                                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                            </button>

                            {/* Divider */}
                            <div className="w-px h-6 bg-neutral-200 dark:bg-white/10 mx-1" />

                            {/* Stop (Small) */}
                            <button
                                onClick={() => handleStop()}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                                <StopCircle size={24} />
                            </button>

                            {/* Skip (Large Pill) */}
                            {/* Skip (Large Pill) */}
                            <button
                                onClick={handleSkip}
                                disabled={partnerStatus === 'connecting' && status !== 'reconnecting'}
                                className={`h-12 md:h-14 px-6 md:px-8 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg 
                                    ${partnerStatus === 'connecting' && status !== 'reconnecting'
                                        ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-blue-600/20'}`}
                            >
                                <span className="hidden md:inline text-lg">Next</span>
                                <SkipForward size={24} />
                            </button>
                        </>
                    ) : (
                        <div className="px-6 py-3 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                            Ready
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
