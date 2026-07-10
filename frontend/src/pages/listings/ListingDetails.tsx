import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { 
  MapPin, Users, Calendar, Wifi, Coffee, Car, Utensils, 
  Shield, CheckCircle, MessageCircle, Heart, Share2, 
  ArrowLeft, Bed, Bath, Home, ChevronLeft, ChevronRight, Mail, Phone
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { buildShareUrl } from '../../utils/share'

const landlordChatIdMap: Record<string, number> = {
  'Md. Rahman': 1,
  'Sadia Akter': 2,
  'Rafiqul Islam': 3,
}

const ListingDetail = () => {
  const { id } = useParams()
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()
  const [currentImage, setCurrentImage] = useState(0)
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadListing = async () => {
      if (!id) {
        setError('Listing not found')
        setLoading(false)
        return
      }

      try {
        const response = await api.get(`/api/listings/${id}`)
        const found = response.data

        setListing({
          ...found,
          facilities: found.features ?? found.facilities ?? [],
          photos:
            Array.isArray(found.photos) && found.photos.length > 0
              ? found.photos
              : found.image
              ? [found.image]
              : [],
          landlordId: found.landlordId,
          landlord: {
            name: found.landlord?.name ?? 'Unknown Host',
            email: found.landlord?.email ?? 'notprovided@example.com',
            phone: found.landlord?.phone ?? 'N/A',
            isVerified: found.landlord?.isVerified ?? false,
            chatId: found.landlord?.chatId,
          },
        })

        if (currentUser?.id) {
          const savedResponse = await api.get(`/api/listings/${id}/saved`)
          setSaved(!!savedResponse.data?.saved)
        } else {
          setSaved(false)
        }
      } catch (err: any) {
        console.error('Failed to load listing', err)
        setError(err?.response?.data?.error ?? 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    loadListing()
  }, [id, currentUser?.id])

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % (listing?.photos?.length || 1))
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + (listing?.photos?.length || 1)) % (listing?.photos?.length || 1))
  }

  const handleContact = () => {
    const chatId = listing?.landlordId ?? listing?.landlord?.chatId ?? null
    if (chatId) {
      navigate('/messenger', {
        state: { contactChatId: chatId },
      })
    } else {
      navigate('/messenger')
    }
  }

  const toggleSave = async () => {
    if (!listing?.id) return
    if (!currentUser?.id) {
      toast.error('Please log in to save listings')
      navigate('/login')
      return
    }

    try {
      if (saved) {
        await api.delete(`/api/listings/${listing.id}/save`)
        setSaved(false)
        toast.success('Removed from saved listings')
      } else {
        await api.post(`/api/listings/${listing.id}/save`)
        setSaved(true)
        toast.success('Listing saved to favorites!')
      }
    } catch (err) {
      console.error('save toggle failed', err)
      toast.error('Failed to update saved listings')
    }
  }

  const handleShare = async () => {
    const shareUrl = buildShareUrl(`/listing/${id}`)
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: listing?.title || 'Listing', url: shareUrl })
        toast.success('Shared successfully')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard')
      } else {
        // fallback
        const dummy = document.createElement('input')
        document.body.appendChild(dummy)
        dummy.value = shareUrl
        dummy.select()
        document.execCommand('copy')
        document.body.removeChild(dummy)
        toast.success('Link copied to clipboard')
      }
    } catch (err) {
      console.error('share failed', err)
      toast.error('Failed to share')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          <h2 className="text-xl font-semibold mb-2">{error ?? 'Listing not found'}</h2>
          <p className="text-gray-500">Please go back to listings or try again later.</p>
          <div className="mt-4">
            <Button onClick={() => navigate('/feed')}>Back to listings</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/feed" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              <div className="relative h-96">
                <img 
                  src={listing.photos?.[currentImage] ?? 'https://placehold.co/800x600?text=No+Image'} 
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {(listing.photos?.length ?? 0) > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2 p-4 overflow-x-auto">
                {(listing.photos ?? []).map((photo: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      currentImage === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Listing Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {listing.location}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={toggleSave} aria-label={saved? 'Unsave listing':'Save listing'}>
                    <Heart className={`w-5 h-5 transition ${saved ? 'text-red-500' : 'text-gray-600'}`} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare} aria-label="Share listing">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="border-t border-b py-4 my-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Bed className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <div className="text-sm font-medium">1 Bedroom</div>
                  </div>
                  <div>
                    <Bath className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <div className="text-sm font-medium">1 Bathroom</div>
                  </div>
                  <div>
                    <Home className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <div className="text-sm font-medium">{listing.furnishing}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-600">{listing.description}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Facilities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {listing.facilities.map((facility: string) => (
                    <div key={facility} className="flex items-center gap-2">
                      {facility === 'WiFi' && <Wifi className="w-4 h-4 text-green-500" />}
                      {facility === 'AC' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {facility === 'Kitchen' && <Utensils className="w-4 h-4 text-green-500" />}
                      {facility === 'Parking' && <Car className="w-4 h-4 text-green-500" />}
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">House Rules</h2>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {listing.rules.map((rule: string) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Booking & Info */}
          <div className="lg:col-span-1">
            {/* Price Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="mb-6">
                <div className="text-3xl font-bold text-blue-600">
                  ৳{(Number(listing.priceValue ?? listing.rent ?? listing.price) || 0).toLocaleString()}
                </div>
                <div className="text-gray-500">per month</div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Available from:</span>
                  <span className="font-medium">
                    {new Date(listing.availableFrom).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Available seats:</span>
                  <span className="font-medium">{listing.availableSeats} seats</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Gender preference:</span>
                  <span className="font-medium">{listing.genderPreference}</span>
                </div>
              </div>

              <Button onClick={handleContact} className="w-full bg-blue-600 hover:bg-blue-700 mb-3">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Landlord
              </Button>

              <Button variant="outline" className="w-full">
                Request Visit
              </Button>
            </div>

            {/* Landlord Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h3 className="font-semibold text-lg mb-3">Posted by</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {listing.landlord?.name?.[0] ?? 'H'}
                </div>
                <div>
                  <div className="font-medium flex items-center gap-1">
                    {listing.landlord?.name ?? 'Unknown Host'}
                    {listing.landlord?.isVerified && (
                      <Badge className="bg-green-500 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {listing.createdAt ? (
                    <div className="text-sm text-gray-500">
                      Posted on {new Date(listing.createdAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Listing posted date unavailable</div>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {listing.landlord?.email ?? 'No email provided'}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {listing.landlord?.phone ?? 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingDetail