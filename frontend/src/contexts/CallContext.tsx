import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { toast } from 'react-hot-toast'
import { useSocket } from './SocketContext'
import { useAuthStore } from '../store/authStore'
import CallPlugin from '../plugins/CallPlugin'

export type CallState = 'idle' | 'calling' | 'ringing' | 'incoming' | 'connecting' | 'in-call'

export interface IncomingCallPayload {
  conversationId: string
  callId?: string
  callerId: string
  callerName: string
  type: 'audio' | 'video'
  sdp: string
}

interface CallPartner {
  id: string
  name: string
  online?: boolean
}

interface CallContextValue {
  callStatus: CallState
  callType: 'audio' | 'video' | null
  incomingOffer: IncomingCallPayload | null
  callPartner: CallPartner | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  callError: string | null
  isMuted: boolean
  cameraEnabled: boolean
  activeConversationId: string | null
  startCall: (type: 'audio' | 'video', conversationId: string, partner: CallPartner) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  hangUp: () => void
  toggleMute: () => void
  toggleCamera: () => void
  cleanupCall: () => void
}

const CallContext = createContext<CallContextValue | null>(null)

// ICE Servers configuration
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
      username: 'webrtc',
      credential: 'webrtc'
    }
  ]
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useSocket()
  const { user } = useAuthStore()

  const [callStatus, setCallStatus] = useState<CallState>('idle')
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null)
  const [incomingOffer, setIncomingOffer] = useState<IncomingCallPayload | null>(null)
  const [callPartner, setCallPartner] = useState<CallPartner | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [callError, setCallError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const activeConversationIdRef = useRef<string | null>(null)
  const activeCallIdRef = useRef<string | null>(null)
  const callAnsweredRef = useRef(false)
  const callTimerRef = useRef<number | null>(null)

  // Cleanup function
  const cleanupCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop())
      remoteStreamRef.current = null
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Clear timeout
    if (callTimerRef.current) {
      clearTimeout(callTimerRef.current)
      callTimerRef.current = null
    }

    // Reset state
    callAnsweredRef.current = false
    setLocalStream(null)
    setRemoteStream(null)
    setCallStatus('idle')
    setCallType(null)
    setCallPartner(null)
    setIncomingOffer(null)
    setCallError(null)
    setActiveConversationId(null)
    setIsMuted(false)
    setCameraEnabled(true)
    activeConversationIdRef.current = null
    activeCallIdRef.current = null
  }

  const ensureMediaPermissions = async (type: 'audio' | 'video') => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        const result = await CallPlugin.requestPermissions()
        const hasMicrophone = result?.microphone ?? true
        const hasCamera = result?.camera ?? true

        if (!hasMicrophone) {
          throw new Error('Microphone permission is required for calls.')
        }

        if (type === 'video' && !hasCamera) {
          throw new Error('Camera permission is required for video calls.')
        }
      } catch (error) {
        console.error('Unable to request native call permissions:', error)
        throw new Error('Microphone and camera permissions are required for calls.')
      }
    }
  }

  // Get user media
  const getUserMedia = async (type: 'audio' | 'video'): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: type === 'video' ? {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } : false
    }

    try {
      await ensureMediaPermissions(type)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      return stream
    } catch (error) {
      console.error('Error getting user media:', error)
      throw new Error('Could not access microphone/camera. Please check permissions.')
    }
  }

  // Create peer connection
  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection(iceServers)

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && activeConversationIdRef.current) {
        socket.emit('ice_candidate', {
          conversationId: activeConversationIdRef.current,
          callId: activeCallIdRef.current,
          candidate: event.candidate,
          senderId: user?.id
        })
      }
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      console.log('ICE connection state:', state)
      
      if (state === 'connected' || state === 'completed') {
        setCallStatus('in-call')
        callAnsweredRef.current = true
        if (callTimerRef.current) {
          clearTimeout(callTimerRef.current)
          callTimerRef.current = null
        }
      } else if (state === 'failed' || state === 'disconnected') {
        toast.error('Call connection lost')
        cleanupCall()
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      console.log('Connection state:', state)
      
      if (state === 'connected') {
        setCallStatus('in-call')
        callAnsweredRef.current = true
      } else if (state === 'failed' || state === 'disconnected') {
        toast.error('Call connection lost')
        cleanupCall()
      }
    }

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind)
      const stream = event.streams[0]
      if (stream) {
        remoteStreamRef.current = stream
        setRemoteStream(stream)
      }
    }

    return pc
  }

  // Start a call
  const startCall = async (type: 'audio' | 'video', conversationId: string, partner: CallPartner) => {
    console.log('📞 CallContext.startCall called:', { type, conversationId, partner })
    
    // Check if socket exists
    if (!socket) {
      console.error('❌ Socket is null in CallContext')
      toast.error('Unable to start call: Socket not connected')
      return
    }

    // Try to connect if not connected
    if (!socket.connected) {
      console.log('⚠️ Socket not connected in CallContext, attempting to connect...')
      socket.connect()
      
      // Wait a moment for connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (!socket.connected) {
        console.error('❌ Socket still not connected after attempt')
        toast.error('Unable to start call: Socket not connected')
        return
      }
    }

    if (!user?.id) {
      toast.error('Please login to start a call')
      return
    }

    try {
      // Get local media stream
      const stream = await getUserMedia(type)
      localStreamRef.current = stream
      setLocalStream(stream)

      // Create peer connection
      const pc = createPeerConnection()
      peerConnectionRef.current = pc

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const callId = `${conversationId}-${Date.now()}`
      activeCallIdRef.current = callId
      activeConversationIdRef.current = conversationId
      setActiveConversationId(conversationId)
      setCallPartner(partner)
      setCallType(type)
      setCallStatus('calling')

      // Send offer to other user
      console.log('📤 Sending offer to:', conversationId)
      socket.emit('offer', {
        conversationId,
        callId,
        callerId: user.id,
        callerName: user.name || 'Unknown User',
        type,
        sdp: offer.sdp || ''
      })

      // Set timeout for call
      callTimerRef.current = window.setTimeout(() => {
        if (!callAnsweredRef.current) {
          toast.error('Call not answered')
          cleanupCall()
        }
      }, 30000)

    } catch (error) {
      console.error('Error starting call:', error)
      toast.error('Failed to start call')
      cleanupCall()
    }
  }

  // Accept an incoming call
  const acceptCall = async () => {
    if (!incomingOffer || !socket || !socket.connected) return

    try {
      const stream = await getUserMedia(incomingOffer.type)
      localStreamRef.current = stream
      setLocalStream(stream)

      const pc = createPeerConnection()
      peerConnectionRef.current = pc

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Set remote description
      await pc.setRemoteDescription({
        type: 'offer',
        sdp: incomingOffer.sdp
      })

      // Create answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      activeConversationIdRef.current = incomingOffer.conversationId
      activeCallIdRef.current = incomingOffer.callId || incomingOffer.conversationId
      setActiveConversationId(incomingOffer.conversationId)
      setCallPartner({ id: incomingOffer.callerId, name: incomingOffer.callerName })
      setCallType(incomingOffer.type)
      setCallStatus('connecting')
      callAnsweredRef.current = true

      // Send answer
      socket.emit('answer', {
        conversationId: incomingOffer.conversationId,
        callId: incomingOffer.callId || incomingOffer.conversationId,
        answer: answer.sdp || ''
      })

      setIncomingOffer(null)

    } catch (error) {
      console.error('Error accepting call:', error)
      toast.error('Failed to accept call')
      cleanupCall()
    }
  }

  // Reject an incoming call
  const rejectCall = () => {
    if (incomingOffer && socket && socket.connected) {
      socket.emit('call_rejected', {
        conversationId: incomingOffer.conversationId,
        callId: incomingOffer.callId || incomingOffer.conversationId
      })
    }
    cleanupCall()
  }

  // Hang up active call
  const hangUp = () => {
    if (socket && socket.connected && activeConversationIdRef.current) {
      socket.emit('end_call', {
        conversationId: activeConversationIdRef.current,
        callId: activeCallIdRef.current
      })
    }
    cleanupCall()
  }

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  // Toggle camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setCameraEnabled(!cameraEnabled)
    }
  }

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleOffer = (payload: IncomingCallPayload) => {
      if (payload.callerId === user?.id) return
      
      setIncomingOffer(payload)
      setCallPartner({ id: payload.callerId, name: payload.callerName })
      setCallType(payload.type)
      setActiveConversationId(payload.conversationId)
      setCallStatus('incoming')
      
      // Ring
      const audio = new Audio('/ringtone.mp3')
      audio.loop = true
      audio.play().catch(() => {})
      
      // Auto-reject after 30 seconds
      callTimerRef.current = window.setTimeout(() => {
        rejectCall()
      }, 30000)
    }

    const handleAnswer = async (payload: { conversationId: string; callId?: string; answer: string }) => {
      if (peerConnectionRef.current && payload.answer) {
        try {
          await peerConnectionRef.current.setRemoteDescription({
            type: 'answer',
            sdp: payload.answer
          })
          setCallStatus('in-call')
          callAnsweredRef.current = true
          if (callTimerRef.current) {
            clearTimeout(callTimerRef.current)
            callTimerRef.current = null
          }
        } catch (error) {
          console.error('Error setting remote description:', error)
        }
      }
    }

    const handleIceCandidate = async (payload: { conversationId: string; callId?: string; candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current && payload.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
        } catch (error) {
          console.warn('Error adding ICE candidate:', error)
        }
      }
    }

    const handleCallRejected = (payload: { conversationId: string; callId?: string }) => {
      if (activeConversationIdRef.current === payload.conversationId) {
        toast.error('Call was rejected')
        cleanupCall()
      }
    }

    const handleEndCall = (payload: { conversationId: string; callId?: string }) => {
      if (activeConversationIdRef.current === payload.conversationId) {
        toast('Call ended')
        cleanupCall()
      }
    }

    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice_candidate', handleIceCandidate)
    socket.on('call_rejected', handleCallRejected)
    socket.on('end_call', handleEndCall)

    return () => {
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('ice_candidate', handleIceCandidate)
      socket.off('call_rejected', handleCallRejected)
      socket.off('end_call', handleEndCall)
    }
  }, [socket, user?.id])

  const value = useMemo<CallContextValue>(() => ({
    callStatus,
    callType,
    incomingOffer,
    callPartner,
    localStream,
    remoteStream,
    callError,
    isMuted,
    cameraEnabled,
    activeConversationId,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleCamera,
    cleanupCall,
  }), [callStatus, callType, incomingOffer, callPartner, localStream, remoteStream, callError, isMuted, cameraEnabled, activeConversationId])

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  )
}

export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}