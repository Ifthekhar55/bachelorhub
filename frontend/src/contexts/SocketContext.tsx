import React, { createContext, useContext, useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

const SocketContext = createContext<Socket | null>(null)

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      // Use the backend socket URL from environment variables
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5003'
      console.log('Connecting to socket:', socketUrl)
      
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 20000,
        auth: {
          token: localStorage.getItem('accessToken')
        }
      })
      
      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully')
      })
      
      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected')
      })
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      newSocket.on('connect', () => {
        newSocket.emit('join_user_room')
      })
      
      setSocket(newSocket)
      
      return () => {
        console.log('Cleaning up socket connection')
        newSocket.close()
      }
    }
  }, [isAuthenticated])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  return context
}