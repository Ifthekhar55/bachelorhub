import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

interface SocketContextValue {
  socket: Socket | null
  connected: boolean
  connecting: boolean
}

const SocketContext = createContext<SocketContextValue>({ 
  socket: null, 
  connected: false,
  connecting: false
})

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const socketUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5003').replace(/\/$/, '')
      console.log('📡 Connecting to socket:', socketUrl)
      
      setConnecting(true)
      
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        auth: {
          token: localStorage.getItem('accessToken')
        }
      })
      
      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully')
        setConnected(true)
        setConnecting(false)
        reconnectAttempts.current = 0
        newSocket.emit('join_user_room', { userId: user.id })
      })
      
      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        setConnected(false)
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
        setConnected(true)
        setConnecting(false)
        newSocket.emit('join_user_room', { userId: user.id })
      })

      newSocket.on('reconnecting', (attemptNumber) => {
        console.log('🔄 Socket reconnecting... Attempt', attemptNumber)
        setConnected(false)
        setConnecting(true)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setConnected(false)
        setConnecting(false)
      })
      
      setSocket(newSocket)
      
      return () => {
        console.log('🧹 Cleaning up socket connection')
        if (newSocket.connected) {
          newSocket.disconnect()
        }
        newSocket.close()
        setSocket(null)
        setConnected(false)
        setConnecting(false)
      }
    } else {
      if (socket) {
        socket.disconnect()
        socket.close()
        setSocket(null)
        setConnected(false)
        setConnecting(false)
      }
    }
  }, [isAuthenticated, user?.id])

  return (
    <SocketContext.Provider value={{ socket, connected, connecting }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  return context.socket
}

export const useSocketConnected = () => {
  const context = useContext(SocketContext)
  return context.connected
}

export const useSocketConnecting = () => {
  const context = useContext(SocketContext)
  return context.connecting
}