// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'tenant' | 'landlord' | 'admin'
  isVerified: boolean
  verificationStatus: 'pending' | 'verified' | 'rejected'
  profilePhoto?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  verifyOTP: (email: string, otp: string) => Promise<void>
  resendOTP: (email: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/api/auth/login', { email, password })
          const { user, accessToken, token } = response.data
          const finalToken = accessToken || token
          if (finalToken) localStorage.setItem('accessToken', finalToken)
          set({ user, isAuthenticated: Boolean(finalToken), isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/api/auth/register', data)
          return response.data
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await api.post('/api/auth/logout')
        } catch (error) {
          // If logout request fails (server missing route or network), still clear client state
          console.warn('Logout request failed', error)
        } finally {
          localStorage.removeItem('accessToken')
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const response = await api.get('/api/auth/me')
          set({ user: response.data, isAuthenticated: true, isLoading: false })
        } catch (error) {
          localStorage.removeItem('accessToken')
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

          verifyOTP: async (email, otp) => {
            set({ isLoading: true })
            try {
              const response = await api.post('/api/auth/verify-otp', { email, otp })
              return response.data
            } finally {
              set({ isLoading: false })
            }
          },
          resendOTP: async (email) => {
            set({ isLoading: true })
            try {
              const response = await api.post('/api/auth/resend-otp', { email })
              return response.data
            } finally {
              set({ isLoading: false })
            }
          },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)