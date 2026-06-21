import { create } from 'zustand'

export interface Notification {
  id: string
  type?: string
  title: string
  body?: string
  data?: Record<string, any>
  isRead: boolean
  createdAt?: string
}

interface NotificationState {
  unreadCount: number
  notifications: Notification[]
  addNotification: (n: Notification) => void
  markAsRead: (id: string) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) => {
    set((state) => {
      const notifications = [n, ...state.notifications]
      const unreadCount = notifications.filter((x) => !x.isRead).length
      return { notifications, unreadCount }
    })
  },
  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      const unreadCount = notifications.filter((x) => !x.isRead).length
      return { notifications, unreadCount }
    })
  },
  markAllRead: () => {
    set((state) => {
      const notifications = state.notifications.map((n) => ({ ...n, isRead: true }))
      return { notifications, unreadCount: 0 }
    })
  },
}))
