import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Home,
  Heart,
  MessageCircle,
  Calendar,
  Eye,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  DollarSign,
  Users,
  Package,
  Briefcase,
  Check,
  X as XIcon,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

interface Listing {
  id: number
  title: string
  location: string
  rent: number
  views: number
  inquiries: number
  status: string
  saved: boolean
  applied: boolean
}

interface UsedItem {
  id: string
  title: string
  price: number
  location: string
  photos: string[]
  isUrgent: boolean
  createdAt: string
  viewCount: number
  _count: { savedBy: number; messages: number }
}

interface SavedItem {
  id: string
  title: string
  price: number
  location: string
  photos: string[]
  isUrgent: boolean
  createdAt: string
}

interface Booking {
  id: string
  packageName: string
  status: string
  startDate: string
  preferredTime: string
  createdAt: string
  tenant: { id: string; name: string; profilePhoto?: string }
  chef: { id: string; name: string; profilePhoto?: string }
}

interface RecentViewedItem {
  id: string
  title: string
  location: string
  price: number
  photo?: string
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'my-listings' | 'saved-items' | 'bookings'>(
    (searchParams.get('tab') as any) || 'overview'
  )
  const [recentItems, setRecentItems] = useState<RecentViewedItem[]>([])
  const [myListings, setMyListings] = useState<UsedItem[]>([])
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)

  // Load all counts on component mount
  useEffect(() => {
    fetchRecentItems()
    fetchMyListings()
    fetchSavedItems()
    fetchBookings()
  }, [])

  useEffect(() => {
    if (activeTab === 'my-listings') fetchMyListings()
    else if (activeTab === 'saved-items') fetchSavedItems()
    else if (activeTab === 'bookings') fetchBookings()
  }, [activeTab])

  const fetchRecentItems = async () => {
    try {
      const raw = localStorage.getItem('recentlyViewedItems')
      const recentData = raw ? JSON.parse(raw) : []
      setRecentItems(Array.isArray(recentData) ? recentData.slice(0, 8) : [])
    } catch (error) {
      console.error('Failed to load recent items:', error)
      toast.error('Failed to load recent items')
    }
  }

  const fetchMyListings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/used-items/my-listings')
      setMyListings(response.data)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
      toast.error('Failed to load your listings')
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedItems = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/used-items/saved/my-items')
      setSavedItems(response.data)
    } catch (error) {
      console.error('Failed to fetch saved items:', error)
      toast.error('Failed to load saved items')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/bookings/my-bookings')
      setBookings(response.data.bookings || [])
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteListing = async (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/api/used-items/${id}`)
        toast.success('Listing deleted successfully')
        fetchMyListings()
      } catch (error) {
        console.error('Failed to delete listing:', error)
        toast.error('Failed to delete listing')
      }
    }
  }

  const handleUnsaveItem = async (id: string) => {
    try {
      await api.delete(`/api/used-items/${id}/save`)
      toast.success('Removed from saved items')
      fetchSavedItems()
    } catch (error) {
      console.error('Failed to remove saved item:', error)
      toast.error('Failed to remove saved item')
    }
  }

  const handleBookingAction = async (bookingId: string, status: 'confirmed' | 'rejected', tenantId?: string) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/status`, { status })
      toast.success(`Booking ${status === 'confirmed' ? 'accepted' : 'rejected'} successfully`)
      await fetchBookings()
      if (status === 'confirmed' && tenantId) {
        navigate('/messenger', { state: { contactChatId: tenantId } })
      }
    } catch (error) {
      console.error('Booking action error:', error)
      toast.error('Failed to update booking status')
    }
  }

  const stats = [
    { label: 'My Listings', value: myListings.length, icon: Package, color: 'text-blue-500', bg: 'bg-blue-100', tab: 'my-listings' as const },
    { label: 'Saved Items', value: savedItems.length, icon: Heart, color: 'text-red-500', bg: 'bg-red-100', tab: 'saved-items' as const },
    { label: 'My Bookings', value: bookings.length, icon: Calendar, color: 'text-green-500', bg: 'bg-green-100', tab: 'bookings' as const },
  ]

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      return {
        month: date.toLocaleString('en', { month: 'short' }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
      }
    })

    return months.map(({ month, year, monthIndex }) => {
      const views = myListings.reduce((total, item) => {
        const createdAt = new Date(item.createdAt)
        if (createdAt.getFullYear() === year && createdAt.getMonth() === monthIndex) {
          return total + (item.viewCount || 0)
        }
        return total
      }, 0)

      const inquiries = myListings.reduce((total, item) => {
        const createdAt = new Date(item.createdAt)
        if (createdAt.getFullYear() === year && createdAt.getMonth() === monthIndex) {
          return total + (item._count?.messages || 0)
        }
        return total
      }, 0)

      return { month, views, inquiries }
    })
  }, [myListings])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account, listings, and bookings</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/post-used-item">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Post New Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 cursor-pointer dark:bg-gray-800" onClick={() => setActiveTab(stat.tab)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-full`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 dark:bg-gray-800">
            <TabsTrigger value="overview" onClick={() => setSearchParams({ tab: 'overview' })}>Overview</TabsTrigger>
            <TabsTrigger value="my-listings" onClick={() => setSearchParams({ tab: 'my-listings' })}>My Listings</TabsTrigger>
            <TabsTrigger value="saved-items" onClick={() => setSearchParams({ tab: 'saved-items' })}>Saved Items</TabsTrigger>
            <TabsTrigger value="bookings" onClick={() => setSearchParams({ tab: 'bookings' })}>Bookings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="p-6 dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Recent Items Viewed</h2>
                    <Link to="/used-items" className="text-green-600 hover:text-green-700 text-sm flex items-center">
                      View all
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentItems.length > 0 ? (
                      recentItems.map((item) => (
                        <Link
                          key={item.id}
                          to={`/used-item/${item.id}`}
                          className="block rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.photo || 'https://placehold.co/80x80'}
                              alt={item.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium">{item.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.location}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">৳{item.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No recently viewed items yet. Visit used items to start viewing.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-6 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">Performance Overview</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Based on your listings activity</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total views</p>
                      <p className="text-lg font-semibold text-green-600">{myListings.reduce((total, item) => total + (item.viewCount || 0), 0)}</p>
                    </div>
                  </div>
                  <div className="h-64">
                    {loading && myListings.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                        Loading performance data...
                      </div>
                    ) : myListings.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                        Post a listing to start tracking views and inquiries.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="views" stroke="#10B981" name="Views" />
                          <Line type="monotone" dataKey="inquiries" stroke="#3B82F6" name="Inquiries" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* My Listings Tab */}
          <TabsContent value="my-listings">
            <Card className="p-6 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">My Listings ({myListings.length})</h2>
                <Link to="/post-used-item">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : myListings.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No listings yet</p>
                  <Link to="/post-used-item" className="mt-3 inline-block">
                    <Button className="bg-green-600 hover:bg-green-700">Post Your First Item</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myListings.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <img
                        src={item.photos[0] || 'https://placehold.co/80x80'}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.location}</p>
                        <p className="text-green-600 font-semibold">৳{item.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/edit-used-item/${item.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteListing(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Saved Items Tab */}
          <TabsContent value="saved-items">
            <Card className="p-6 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Saved Items ({savedItems.length})</h2>
                <Link to="/used-items">
                  <Button variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : savedItems.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No saved items yet</p>
                  <Link to="/used-items" className="mt-3 inline-block">
                    <Button>Explore Used Items</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <img
                        src={item.photos[0] || 'https://placehold.co/80x80'}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.location}</p>
                        <p className="text-green-600 font-semibold">৳{item.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/used-item/${item.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleUnsaveItem(item.id)}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          Unsave
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card className="p-6 dark:bg-gray-800">
              <h2 className="text-xl font-semibold mb-4">My Bookings ({bookings.length})</h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const isChef = booking.chef.id === user?.id
                    return (
                      <div key={booking.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{booking.packageName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {isChef ? `Requested by ${booking.tenant.name}` : `Booked with ${booking.chef.name}`}
                            </p>
                          </div>
                          <Badge
                            className={
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : booking.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Date: {new Date(booking.startDate).toLocaleDateString()} | Time: {booking.preferredTime}
                        </p>
                        {isChef && booking.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                              onClick={() => handleBookingAction(booking.id, 'confirmed', booking.tenant.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleBookingAction(booking.id, 'rejected')}
                            >
                              <XIcon className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {booking.status === 'confirmed' && isChef && (
                          <Link to="/messenger" state={{ contactChatId: booking.tenant.id }}>
                            <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard

