import { useState, useEffect } from 'react'
import { X, Bell } from 'lucide-react'
import { Button } from '../ui/button'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { useSocket } from '../../contexts/SocketContext'

interface Notification {
  id: string
  type: string
  title: string
  body?: string
  data?: Record<string, any>
  isRead: boolean
  createdAt?: string
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

const getFallbackNotifications = (): Notification[] => {
  const now = new Date()
  const baseTime = now.getTime()

  return [
    {
      id: 'review-1',
      type: 'review',
      title: 'Someone reviewed your profile',
      body: 'A user left a positive review for your recent interaction.',
      isRead: false,
      createdAt: new Date(baseTime - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'rating-1',
      type: 'rating',
      title: 'Your average rating changed',
      body: 'Your average rating increased to 4.8 based on recent feedback.',
      isRead: false,
      createdAt: new Date(baseTime - 18 * 60 * 1000).toISOString(),
    },
    {
      id: 'blood-1',
      type: 'blood',
      title: 'Blood request matches your blood group',
      body: 'A nearby urgent blood request matches your blood group and location.',
      isRead: false,
      createdAt: new Date(baseTime - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'like-1',
      type: 'like',
      title: 'Someone liked your post',
      body: 'One of your community posts received a new like.',
      isRead: true,
      createdAt: new Date(baseTime - 55 * 60 * 1000).toISOString(),
    },
    {
      id: 'comment-1',
      type: 'comment',
      title: 'Someone commented on your post',
      body: 'A new comment was added to your recent post.',
      isRead: false,
      createdAt: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reply-1',
      type: 'reply',
      title: 'Someone replied to your comment',
      body: 'Your comment received a reply from another user.',
      isRead: true,
      createdAt: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mention-1',
      type: 'mention',
      title: 'Someone mentioned you',
      body: 'You were mentioned in a community discussion.',
      isRead: false,
      createdAt: new Date(baseTime - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'welcome-1',
      type: 'welcome',
      title: 'Welcome notification',
      body: 'Welcome back to BachelorHub. Explore new features and connect with people nearby.',
      isRead: true,
      createdAt: new Date(baseTime - 7 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'announcement-1',
      type: 'announcement',
      title: 'New feature announcements',
      body: 'A new matching and messaging experience is now available.',
      isRead: false,
      createdAt: new Date(baseTime - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'update-1',
      type: 'update',
      title: 'App update available',
      body: 'A new app update is ready to install for the best experience.',
      isRead: true,
      createdAt: new Date(baseTime - 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'listing-1',
      type: 'listing',
      title: 'New listings matching your saved filters',
      body: 'We found new listings that match your saved preferences.',
      isRead: false,
      createdAt: new Date(baseTime - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'booking-1',
      type: 'booking',
      title: 'Booking request',
      body: 'You received a new booking request for one of your listings.',
      isRead: false,
      createdAt: new Date(baseTime - 14 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

const NotificationsModal = ({ isOpen, onClose }: NotificationsModalProps) => {
  const socket = useSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      console.log('NotificationsModal opened')
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (payload: { notification?: Notification }) => {
      const incoming = payload?.notification
      if (!incoming) return

      setNotifications((current) => {
        if (current.some((item) => item.id === incoming.id)) {
          return current
        }
        return [incoming, ...current]
      })
    }

    socket.on('new_notification', handleNewNotification)

    return () => {
      socket.off('new_notification', handleNewNotification)
    }
  }, [socket])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/api/users/notifications')
      console.log('Notifications fetched:', response.data)

      const serverNotifications = response.data?.notifications
      setNotifications(Array.isArray(serverNotifications) ? serverNotifications : [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setNotifications([])
      setError('Unable to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const formatNotificationType = (type: string) => {
    switch (type) {
      case 'message':
        return 'Message'
      case 'booking':
        return 'Booking'
      case 'booking-request':
        return 'Booking Request'
      case 'listing':
        return 'Listing'
      case 'listing-match':
        return 'Listing Match'
      case 'promotional':
        return 'Promotional'
      case 'review':
        return 'Review'
      case 'rating':
        return 'Rating'
      case 'blood':
        return 'Blood Request'
      case 'like':
        return 'Like'
      case 'comment':
        return 'Comment'
      case 'reply':
        return 'Reply'
      case 'mention':
        return 'Mention'
      case 'welcome':
        return 'Welcome'
      case 'announcement':
        return 'Announcement'
      case 'update':
        return 'Update'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/api/users/notifications/read/${id}`)
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
      toast.error('Failed to update notification')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/users/notifications/read-all')
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      toast.error('Failed to update notifications')
    }
  }

  return (
    <div 
      className={isOpen ? "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50" : "hidden"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2 p-6">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-4 transition ${
                    notification.isRead
                      ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                      : 'border-blue-300 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400 mt-1">
                        {formatNotificationType(notification.type)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2"></div>
                    )}
                  </div>

                  {notification.body && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {notification.body}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs h-8"
                      >
                        Mark as read
                      </Button>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && notifications.length > 0 && (
          <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={notifications.every((n) => n.isRead)}
              className="flex-1"
            >
              Mark all as read
            </Button>
            <Button 
              onClick={onClose} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsModal

