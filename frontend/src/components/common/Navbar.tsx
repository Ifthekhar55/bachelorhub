// src/components/common/Navbar.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home,
  Search,
  Users,
  Coffee,
  MessageCircle,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Shield,
  Moon,
  Sun,
  CheckCircle,
  ShoppingBag,
  Droplet
} from 'lucide-react'
import logo from '../../assets/Icon.png'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import api from '../../services/api'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { useSocket } from '../../contexts/SocketContext'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const { user, isAuthenticated, logout, isLoading } = useAuthStore()
  const { unreadCount, addNotification } = useNotificationStore()
  const socket = useSocket()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Fetch unread message count
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadMessagesCount()
    }
  }, [isAuthenticated])

  // Listen for messages-read event to refresh unread count
  useEffect(() => {
    const handleMessagesRead = () => {
      console.log('Messages read event received, refreshing unread count...')
      fetchUnreadMessagesCount()
    }
    window.addEventListener('messages-read', handleMessagesRead)
    return () => window.removeEventListener('messages-read', handleMessagesRead)
  }, [])

  // Listen for live unread message events from socket
  useEffect(() => {
    if (!socket) return

    const refreshCount = () => {
      console.log('Socket unread/read event received, refreshing unread count...')
      fetchUnreadMessagesCount()
    }

    const handleNewNotification = (payload: { notification?: any }) => {
      const incoming = payload?.notification
      if (!incoming) return
      addNotification({
        id: incoming.id,
        type: incoming.type,
        title: incoming.title,
        body: incoming.body,
        data: incoming.data,
        isRead: Boolean(incoming.isRead),
        createdAt: incoming.createdAt,
      })
    }

    socket.on('new_unread_message', refreshCount)
    socket.on('messages_read', refreshCount)
    socket.on('new_notification', handleNewNotification)

    return () => {
      socket.off('new_unread_message', refreshCount)
      socket.off('messages_read', refreshCount)
      socket.off('new_notification', handleNewNotification)
    }
  }, [socket, addNotification])

  const fetchUnreadMessagesCount = async () => {
    try {
      const response = await api.get('/api/chat/unread-count')
      const count = Number(response.data?.chatUnreadCount ?? response.data?.unreadCount ?? 0)
      console.log('Fetched unread messages count:', count, response.data)
      setUnreadMessagesCount(count)
    } catch (error) {
      console.error('Failed to fetch unread message count:', error)
      setUnreadMessagesCount(0)
    }
  }

  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/feed', label: 'Find House', icon: Search },
    { path: '/homechef', label: 'Homechef', icon: Coffee },
    { path: '/used-items', label: 'Used Items', icon: ShoppingBag },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/blood-requests', label: 'Need Blood?', icon: Droplet },
  ]

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return 'U'
    return user.name.charAt(0).toUpperCase()
  }

  // Check if user has profile photo
  const hasProfilePhoto = () => {
    return user?.profilePhoto && user.profilePhoto !== ''
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button (left of logo on small screens) */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-3"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <img src={logo} alt="BachelorHub logo" className="w-10 h-10 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                BachelorHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors flex items-center space-x-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.path === '/messenger' && unreadMessagesCount > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white rounded-full px-2 text-[10px] font-semibold">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Section (profile always visible, theme/language move to mobile menu) */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="hidden md:inline-flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full w-10 h-10"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
              </div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative hover:ring-2 hover:ring-green-500 rounded-full transition-all h-auto w-auto p-0"
                  >
                    <Avatar className="h-10 w-10 border-2 border-green-500 shadow-md hover:shadow-lg transition-shadow cursor-pointer flex-shrink-0">
                      {isAuthenticated && hasProfilePhoto() ? (
                        <AvatarImage src={user?.profilePhoto} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                        {isAuthenticated ? (
                          <span className="text-lg font-semibold">{getUserInitials()}</span>
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {isAuthenticated && user?.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 ring-2 ring-white dark:ring-gray-900">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {isAuthenticated && unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 min-w-[20px] h-5 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                        <span className="text-white text-xs font-bold">{Number.isFinite(unreadCount) ? (unreadCount > 9 ? '9+' : String(unreadCount)) : '0'}</span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  className="w-80 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 mt-2"
                  sideOffset={8}
                  align="end"
                >
                  {isAuthenticated && user ? (
                    // Logged In Menu
                    <>
                      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14 border-2 border-green-500">
                            {hasProfilePhoto() ? (
                              <AvatarImage src={user?.profilePhoto} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              {user?.role && user.role !== 'tenant' && (
                                <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                              )}
                              {user?.isVerified && (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs px-2 py-0.5 rounded-full">
                                  ✓ Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenuGroup className="py-2">
                        <DropdownMenuItem onClick={() => navigate('/create-listing')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                          <PlusCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium">Post Listing</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/post-used-item')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                          <ShoppingBag className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium">Sell Item</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                          <User className="w-5 h-5" />
                          <span className="text-sm font-medium">My Profile</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                          <LayoutDashboard className="w-5 h-5" />
                          <span className="text-sm font-medium">Dashboard</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/messenger')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Messages</span>
                          {unreadMessagesCount > 0 && (
                            <Badge className="ml-auto bg-red-500 text-white rounded-full px-2">
                              {unreadMessagesCount > 9 ? '9+' : String(unreadMessagesCount)}
                            </Badge>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/profile?showNotifications=true')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                          <Bell className="w-5 h-5" />
                          <span className="text-sm font-medium">Notifications</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                          <Settings className="w-5 h-5" />
                          <span className="text-sm font-medium">Settings</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                          <HelpCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Help & Support</span>
                        </DropdownMenuItem>

                        {user?.role === 'admin' && (
                          <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3">
                            <Shield className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-600">Admin Panel</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-3">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Logout</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    // Logged Out Menu
                    <>
                      <div className="px-4 py-6 text-center">
                        <div className="mx-auto w-20 h-20 mb-4">
                          <Avatar className="w-20 h-20 mx-auto border-4 border-green-500">
                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                              <User className="w-10 h-10" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <h3 className="font-bold text-xl mb-1">Welcome Back!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to access your account</p>
                        
                        <div className="space-y-3">
                          <Button 
                            onClick={() => navigate('/login')} 
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-11 text-base font-semibold"
                          >
                            Login to Your Account
                          </Button>
                          <Button 
                            onClick={() => navigate('/register')} 
                            variant="outline" 
                            className="w-full h-11 text-base font-semibold"
                          >
                            Create New Account
                          </Button>
                        </div>
                      </div>
                      
                      <DropdownMenuSeparator />
                      
                      <div className="px-4 py-3">
                        <p className="text-xs text-center text-gray-500">
                          New to BachelorHub?{" "}
                          <button 
                            onClick={() => navigate('/register')} 
                            className="text-green-600 hover:underline font-medium"
                          >
                            Create an account
                          </button>
                        </p>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <div className="container mx-auto px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                    {link.path === '/messenger' && unreadMessagesCount > 0 && (
                      <Badge className="ml-auto bg-red-500 text-white rounded-full px-2 text-[10px] font-semibold">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </Badge>
                    )}
                  </Link>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}

export default Navbar