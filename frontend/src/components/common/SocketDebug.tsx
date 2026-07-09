import { useState, useEffect } from 'react'
import { useSocket, useSocketConnected } from '../../contexts/SocketContext'

const SocketDebug = () => {
  const socket = useSocket()
  const connected = useSocketConnected()
  const [status, setStatus] = useState('unknown')
  const [socketId, setSocketId] = useState('')

  useEffect(() => {
    if (!socket) {
      setStatus('no-socket')
      setSocketId('')
      return
    }

    const updateStatus = () => {
      setStatus(socket.connected ? 'connected' : 'disconnected')
      setSocketId(socket.id || '')
    }

    updateStatus()

    socket.on('connect', updateStatus)
    socket.on('disconnect', updateStatus)
    socket.on('reconnect', updateStatus)

    return () => {
      socket.off('connect', updateStatus)
      socket.off('disconnect', updateStatus)
      socket.off('reconnect', updateStatus)
    }
  }, [socket])

  const statusColors = {
    connected: 'text-green-600',
    disconnected: 'text-red-600',
    'no-socket': 'text-gray-600',
    unknown: 'text-gray-400'
  }

  const statusLabels = {
    connected: '✅ Connected',
    disconnected: '❌ Disconnected',
    'no-socket': '🚫 No Socket',
    unknown: '⏳ Unknown'
  }

  return (
    <div className="flex items-center gap-2 text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
      <div className={`w-2 h-2 rounded-full ${
        status === 'connected' ? 'bg-green-500 animate-pulse' : 
        status === 'disconnected' ? 'bg-red-500' : 'bg-gray-400'
      }`} />
      <span className={statusColors[status as keyof typeof statusColors] || 'text-gray-400'}>
        {statusLabels[status as keyof typeof statusLabels] || status}
        {socketId && ` (${socketId.slice(0, 6)})`}
      </span>
    </div>
  )
}

export default SocketDebug