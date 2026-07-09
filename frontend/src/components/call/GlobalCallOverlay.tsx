import React from 'react'
import { Phone, PhoneOff, Video, Mic, MicOff, Camera, CameraOff, X } from 'lucide-react'
import { Button } from '../ui/button'
import { useCall } from '../../contexts/CallContext'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const GlobalCallOverlay = () => {
  const {
    callStatus,
    callType,
    callPartner,
    localStream,
    remoteStream,
    isMuted,
    cameraEnabled,
    incomingOffer,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleCamera
  } = useCall()

  const localVideoRef = React.useRef<HTMLVideoElement>(null)
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null)

  // Set local stream
  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch(() => {})
    }
  }, [localStream])

  // Set remote stream
  React.useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream])

  // Show nothing if no active call
  if (callStatus === 'idle') return null

  const isIncoming = callStatus === 'incoming'
  const isCalling = callStatus === 'calling' || callStatus === 'ringing'
  const isInCall = callStatus === 'in-call' || callStatus === 'connecting'

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto p-4 relative">
        {/* Remote Video */}
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
          {callType === 'video' && remoteStream ? (
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Avatar className="w-32 h-32">
                <AvatarFallback className="text-6xl bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  {callPartner?.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-white text-2xl font-semibold mt-6">
                {callPartner?.name || 'Unknown User'}
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                {isIncoming ? 'is calling you...' : 
                 isCalling ? 'calling...' : 
                 isInCall ? 'Connected' : ''}
              </p>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {callType === 'video' && localStream && isInCall && (
            <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/50 shadow-lg">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isIncoming ? 'bg-green-500 text-white animate-pulse' :
              isCalling ? 'bg-yellow-500 text-white' :
              isInCall ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {isIncoming ? 'Incoming Call' :
               isCalling ? 'Calling...' :
               isInCall ? 'Connected' : 'Call Ended'}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {isIncoming ? (
              <>
                <Button
                  onClick={acceptCall}
                  className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 transition-all hover:scale-110"
                >
                  <Phone className="w-6 h-6" />
                </Button>
                <Button
                  onClick={rejectCall}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-all hover:scale-110"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </>
            ) : isInCall ? (
              <>
                <Button
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-full transition-all hover:scale-110 ${
                    isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>
                {callType === 'video' && (
                  <Button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full transition-all hover:scale-110 ${
                      cameraEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {cameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
                  </Button>
                )}
                <Button
                  onClick={hangUp}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-all hover:scale-110"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </>
            ) : (
              <Button
                onClick={hangUp}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-all hover:scale-110"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalCallOverlay