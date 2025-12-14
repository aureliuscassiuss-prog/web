import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Video, Mic, MicOff, VideoOff, SkipForward, AlertCircle, Loader2 } from 'lucide-react'

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
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Refs for persistence without re-renders
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const peerRef = useRef<RTCPeerConnection | null>(null)
    const queueSubscriptionRef = useRef<any>(null)
    const signalChannelRef = useRef<any>(null)
    const myQueueIdRef = useRef<string | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handleStop()
        }
    }, [])

    // Initialize Local Stream
    const initLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            setLocalStream(stream)
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
            }
            return stream
        } catch (err) {
            console.error("Camera error:", err)
            setStatus('error')
            setErrorMsg('Could not access camera/microphone. Please allow permissions.')
            return null
        }
    }

    // Toggle Mute
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled)
            setIsMuted(!isMuted)
        }
    }

    // Toggle Video
    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
            setIsVideoOff(!isVideoOff)
        }
    }

    // --- RTC LOGIC ---

    const createPeer = (initiator: boolean, signalChannel: any) => {
        const peer = new RTCPeerConnection(RTC_CONFIG)
        peerRef.current = peer

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => peer.addTrack(track, localStream))
        }

        // Handle remote tracks
        peer.ontrack = (event) => {
            console.log("Remote track received")
            setRemoteStream(event.streams[0])
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0]
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
                // handleStop() // Don't stop immediately, wait for user or try to recover?
                // Ideally, restart search
                setStatus('idle')
            }
        }

        return peer
    }

    // --- MATCHING LOGIC ---

    const startSearch = async () => {
        if (!user) return
        setErrorMsg('')

        let stream = localStream
        if (!stream) {
            stream = await initLocalStream()
            if (!stream) return
        }

        setStatus('searching')

        // 1. Check if anyone is waiting in the queue (excluding myself)
        // using RPC or simple select. RLS filters might prevent seeing others if config is strict, 
        // but our migration allowed public select.

        // Find a random user not me
        const { data: candidates, error } = await supabase
            .from('video_chat_queue')
            .select('*')
            .neq('user_id', user.id)
            .is('matched_with', null)
            .limit(1)

        if (error) {
            console.error("Queue check error", error)
            // Continue to wait...
        }

        if (candidates && candidates.length > 0) {
            const target = candidates[0]
            console.log("Found potential partner:", target.user_id)

            // 2. Try to CLAIM this user
            const { error: claimError } = await supabase
                .from('video_chat_queue')
                .update({ matched_with: user.id })
                .eq('id', target.id)
                .is('matched_with', null) // Optimistic Lock

            if (!claimError) {
                // SUCCESS: We are the CALLER
                console.log("Claimed partner. Acting as CALLER.")
                initiateCall(target.id, true)
                return
            } else {
                console.log("Failed to claim (race condition), joining queue instead.")
            }
        }

        // 3. No one found or claim failed -> Join Queue (as CALLEE)
        addToQueue()
    }

    const addToQueue = async () => {
        if (!user) return

        // Insert self
        const { data, error } = await supabase
            .from('video_chat_queue')
            .insert({ user_id: user.id })
            .select()
            .single()

        if (error) {
            console.error("Join queue error:", error)
            // If Duplicate error, maybe we are already in queue?
            if (error.code === '23505') { // Unique violation
                // Try to fetch existing
                const { data: existing } = await supabase.from('video_chat_queue').select().eq('user_id', user.id).single()
                if (existing) myQueueIdRef.current = existing.id
            } else {
                setErrorMsg("Failed to join queue.")
                setStatus('error')
                return
            }
        } else {
            myQueueIdRef.current = data.id
        }

        // 4. Subscribe to MY row to see when someone picks me
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
                        console.log("I was picked by:", payload.new.matched_with)
                        // We are the CALLEE
                        // The session ID is My Queue ID (the row where match happened)
                        initiateCall(myQueueIdRef.current!, false)
                    }
                }
            )
            .subscribe()
    }

    const initiateCall = async (sessionId: string, isCaller: boolean) => {
        console.log(`Starting call. Session: ${sessionId}, I am Caller: ${isCaller}`)

        // Remove from queue logic (if I was in queue waiting)
        // If I was the Picker, I wasn't in queue. If I was Pickee, I am in queue.
        // We can clean up the queue row LATER (on disconnect) or now. 
        // Better now to prevent others from picking me? 
        // Wait, if I am Pickee, row is already 'matched_with' so no one else can pick.
        // If I am Picker, I am not in queue.

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
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    if (isCaller) {
                        const offer = await peer.createOffer()
                        await peer.setLocalDescription(offer)
                        // Give a small delay for sub to be ready on other side?
                        // Supabase realtime doesn't buffer. Pickee needs to be subbed.
                        // Pickee initiates SUB immediately when matched.
                        // Caller initiates SUB immediately after claiming.
                        // To be safe, Caller sends OFFER periodically until Answered?
                        // Or wait a second.
                        setTimeout(() => {
                            channel.send({
                                type: 'broadcast',
                                event: 'signal',
                                payload: { type: 'offer', offer }
                            })
                        }, 1000)
                    }
                }
            })

        setStatus('connected')
    }

    // --- STOP / SKIP ---

    const handleStop = async () => {
        setStatus('idle')
        setRemoteStream(null)
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

        // cleanup peer
        if (peerRef.current) {
            peerRef.current.close()
            peerRef.current = null
        }

        // cleanup channels
        if (signalChannelRef.current) {
            supabase.removeChannel(signalChannelRef.current)
            signalChannelRef.current = null
        }
        if (queueSubscriptionRef.current) {
            supabase.removeChannel(queueSubscriptionRef.current)
            queueSubscriptionRef.current = null
        }

        // Cleanup DB (remove from queue if exists)
        if (user) {
            await supabase.from('video_chat_queue').delete().eq('user_id', user.id)
        }
        myQueueIdRef.current = null
    }

    const handleSkip = async () => {
        await handleStop()
        startSearch()
    }

    // --- RENDER ---

    return (
        <div className="flex flex-col h-[100dvh] bg-neutral-950 text-white overflow-hidden">
            {/* Header (Minimal) */}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-white/10 shrink-0 z-10">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        VideoChat
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/20">Beta</span>
                </div>
                <div className="text-sm text-neutral-400">
                    {status === 'searching' && "Looking for someone..."}
                    {status === 'connected' && "Connected to stranger"}
                    {status === 'idle' && "Ready to start"}
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black">

                {/* Remote Video (Full Screen) */}
                {status === 'connected' && (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                    />
                )}

                {/* Placeholder / Search UI */}
                {(status === 'idle' || status === 'searching') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0">
                        {status === 'searching' ? (
                            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 animate-ping absolute inset-0"></div>
                                    <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center relative z-10 border border-white/10">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-medium text-white">Searching for partner...</h3>
                                <p className="text-neutral-500 text-sm max-w-xs">
                                    We are connecting you with a random student. Please be polite!
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 max-w-md">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-2">
                                    <Video className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold">Random Video Chat</h2>
                                <p className="text-neutral-400">
                                    Meet new people from your university. Connect instantly.
                                    Remember to follow community guidelines.
                                </p>
                                <button
                                    onClick={startSearch}
                                    className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center gap-2"
                                >
                                    Start Matching <SkipForward className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Local Video (Floating PIP) */}
                <div className="absolute bottom-6 right-6 w-32 md:w-48 aspect-[3/4] md:aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl z-20">
                    {localStream ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : ''}`}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
                            <VideoOff className="w-6 h-6" />
                        </div>
                    )}

                    {/* Mute/Video Indicators */}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                        {isMuted && <div className="p-1 bg-red-500/80 rounded-full"><MicOff size={10} /></div>}
                        {isVideoOff && <div className="p-1 bg-red-500/80 rounded-full"><VideoOff size={10} /></div>}
                    </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
                        <AlertCircle size={16} />
                        {errorMsg}
                    </div>
                )}

            </div>

            {/* Controls Footer */}
            <div className="h-20 bg-neutral-900/90 backdrop-blur border-t border-white/5 shrink-0 flex items-center justify-center gap-4 px-4">

                {status !== 'idle' && (
                    <>
                        <button
                            onClick={toggleMute}
                            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-neutral-800 hover:bg-neutral-700 text-white'}`}
                        >
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-neutral-800 hover:bg-neutral-700 text-white'}`}
                        >
                            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>

                        <div className="w-px h-8 bg-white/10 mx-2"></div>

                        <button
                            onClick={handleSkip}
                            className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <SkipForward className="w-5 h-5" />
                            Skip
                        </button>

                        <button
                            onClick={handleStop}
                            className="px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full font-medium transition-all"
                        >
                            Stop
                        </button>
                    </>
                )}

                {status === 'idle' && localStream && (
                    <div className="text-neutral-500 text-sm">
                        Camera and microphone ready
                    </div>
                )}
            </div>
        </div>
    )
}
