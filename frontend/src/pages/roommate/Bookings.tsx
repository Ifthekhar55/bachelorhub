import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X as XIcon } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

interface Booking {
  id: string
  packageName: string
  status: string
  startDate: string
  preferredTime: string
  createdAt: string
  tenant: {
    id: string
    name: string
    profilePhoto?: string
  }
  chef: {
    id: string
    name: string
    profilePhoto?: string
  }
}

const Bookings = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/bookings/my-bookings')
      setBookings(response.data.bookings || [])
    } catch (err: any) {
      console.error('Fetch bookings error:', err)
      setError(err?.response?.data?.error || 'Unable to load bookings')
      toast.error('Unable to load bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleBookingAction = async (bookingId: string, status: 'confirmed' | 'rejected', tenantId?: string) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/status`, { status })
      toast.success(`Booking ${status === 'confirmed' ? 'accepted' : 'rejected'} successfully.`)
      await fetchBookings()
      if (status === 'confirmed' && tenantId) {
        navigate('/messenger', { state: { contactChatId: tenantId } })
      }
    } catch (err: any) {
      console.error('Booking action error:', err)
      const message = err?.response?.data?.error || 'Failed to update booking status.'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-gray-600 dark:text-gray-400">View all booking requests for homechefs and tenants.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/homechef')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homechefs
          </Button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-10 text-center">
            <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
            <p className="text-gray-600 dark:text-gray-400">You can book a chef from the Homechef page.</p>
            <Button className="mt-4" onClick={() => navigate('/homechef')}>
              Browse Homechefs
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => {
              const isChef = booking.chef.id === user?.id
              return (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{booking.packageName}</h2>
                        <Badge variant={booking.status === 'pending' ? 'secondary' : booking.status === 'confirmed' ? 'default' : 'outline'}>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {isChef ? 'Requested by' : 'Booked with'} <span className="font-semibold">{isChef ? booking.tenant.name : booking.chef.name}</span>
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>{new Date(booking.startDate).toLocaleDateString()}</p>
                      <p>{booking.preferredTime}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                      <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{isChef ? 'Tenant' : 'Chef'}</p>
                      <p className="text-sm font-medium">{isChef ? booking.tenant.name : booking.chef.name}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                      <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Requested on</p>
                      <p className="text-sm font-medium">{new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {isChef && booking.status === 'pending' && (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Button
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                        onClick={() => handleBookingAction(booking.id, 'confirmed', booking.tenant.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                        onClick={() => handleBookingAction(booking.id, 'rejected')}
                      >
                        <XIcon className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Bookings
