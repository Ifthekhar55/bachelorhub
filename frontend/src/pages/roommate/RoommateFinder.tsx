import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, UserPlus, MessageCircle, MapPin, DollarSign, Calendar, Heart,
  Star, Clock, AlertCircle, X, ChefHat, Briefcase, Phone, Shield, CheckCircle,
  Heart as HeartSolid, Home, ShoppingCart, RotateCw, MoreVertical, Share2, Edit2, Trash2
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { buildShareUrl } from '../../utils/share'

interface Chef {
  id: string
  name: string
  avatar: string
  location: string
  experience: string
  specialties: string[]
  startingPrice: number
  rating: number
  reviews: number
  verified: boolean
  topRated: boolean
  isHomechef: boolean
  foods: string[]
  cuisines: string[]
  availability: string[]
  mealTypes: string[]
  bio: string
  photos: string[]
  schedule: string
  packages: { name: string; price: number; description: string }[]
  reviewsList: { user: string; rating: number; text: string }[]
  savedBy?: number
}

const RoommateFinder = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedCuisine, setCuisine] = useState('')
  const [selectedMealType, setMealType] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [availability, setAvailability] = useState('')
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null)
  const [activeTab, setActiveTab] = useState<string>('profile')
  const [savedChefs, setSavedChefs] = useState<string[]>([])
  const [showBooking, setShowBooking] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [bookingPackage, setBookingPackage] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [chefProfiles, setChefProfiles] = useState<Chef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [removingChefId, setRemovingChefId] = useState<string | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    fetchHomechefs()
  }, [])

  useEffect(() => {
    if (selectedChef) setActiveTab('profile')
  }, [selectedChef])

  useEffect(() => {
    if (!selectedChef?.id) return

    const loadChefReviews = async () => {
      try {
        const response = await api.get(`/api/users/${selectedChef.id}/reviews`)
        const reviews = response.data.reviews || []
        const mappedReviews = reviews.map((review: any) => ({
          id: review.id,
          user: review.reviewer?.name || 'Anonymous',
          rating: Number(review.rating) || 0,
          text: review.comment || '',
          createdAt: review.createdAt,
        }))

        setSelectedChef((prev) => prev && prev.id === selectedChef.id
          ? { ...prev, reviewsList: mappedReviews, reviews: mappedReviews.length }
          : prev)
        setChefProfiles((prev) => prev.map((chef) => chef.id === selectedChef.id
          ? { ...chef, reviewsList: mappedReviews, reviews: mappedReviews.length }
          : chef))
      } catch (error) {
        console.error('Failed to load chef reviews:', error)
      }
    }

    loadChefReviews()
  }, [selectedChef?.id])

  const fetchHomechefs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/users/homechefs')
      const homechefs = response.data.data || response.data || []
      
      // Transform backend data to Chef interface
      const transformedChefs: Chef[] = homechefs.map((user: any) => {
        let packagesArr: { name: string; price: number; description: string }[] = []
        if (Array.isArray(user.packages)) {
          packagesArr = user.packages
        } else if (typeof user.packages === 'string') {
          try {
            packagesArr = JSON.parse(user.packages)
          } catch (e) {
            packagesArr = []
          }
        }

        const startingPrice = packagesArr.length > 0 
          ? Math.min(...packagesArr.map((p: any) => p.price || 0))
          : 0

        let specialtiesArr: string[] = []
        if (Array.isArray(user.specialties)) {
          specialtiesArr = user.specialties
        } else if (typeof user.specialties === 'string') {
          try {
            specialtiesArr = JSON.parse(user.specialties)
          } catch (e) {
            specialtiesArr = user.specialties.split(',').map((s: string) => s.trim())
          }
        }

        let foodsArr: string[] = []
        if (Array.isArray(user.foods)) {
          foodsArr = user.foods
        } else if (typeof user.foods === 'string') {
          try {
            foodsArr = JSON.parse(user.foods)
          } catch (e) {
            foodsArr = user.foods.split(',').map((f: string) => f.trim())
          }
        }

        const profilePhoto = typeof user.profilePhoto === 'string' ? user.profilePhoto.trim() : ''

        return {
          id: String(user.id),
          name: user.name,
          avatar: profilePhoto || '',
          location: user.location || user.servingArea || 'Dhaka',
          experience: user.experience || '',
          specialties: specialtiesArr,
          startingPrice,
          rating: user.rating || 4.5,
          reviews: user.reviewsCount || 0,
          verified: user.isVerified || false,
          topRated: (user.rating || 0) >= 4.7,
          isHomechef: user.isHomechef === true,
          foods: foodsArr,
          cuisines: specialtiesArr, // Use specialties as cuisines
          availability: ['Morning', 'Evening'], // Default
          mealTypes: ['Lunch', 'Dinner', 'All-day'], // Default
          bio: user.bio || '',
          photos: user.foodPhotos ? (Array.isArray(user.foodPhotos) ? user.foodPhotos : [user.foodPhotos]) : [],
          schedule: user.schedule || '',
          packages: packagesArr,
          reviewsList: []
        }
      })

      setChefProfiles(transformedChefs)
      setError(false)
    } catch (error) {
      console.error('Failed to fetch homechefs:', error)
      setChefProfiles([])
      setError(true)
      toast.error('Failed to load homechefs. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const filteredChefs = chefProfiles.filter(chef => {
    const isHomechef = chef.isHomechef === true
    const matchesSearch = chef.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = !selectedLocation || chef.location.toLowerCase().includes(selectedLocation.toLowerCase())
    const matchesCuisine = !selectedCuisine || chef.cuisines.includes(selectedCuisine)
    const matchesMealType = !selectedMealType || chef.mealTypes.includes(selectedMealType)
    const matchesBudget = !budgetRange || (budgetRange === 'under-3000' && chef.startingPrice < 3000) ||
      (budgetRange === '3000-5000' && chef.startingPrice >= 3000 && chef.startingPrice <= 5000) ||
      (budgetRange === 'above-5000' && chef.startingPrice > 5000)
    const matchesAvailability = !availability || chef.availability.includes(availability)
    return isHomechef && matchesSearch && matchesLocation && matchesCuisine && matchesMealType && matchesBudget && matchesAvailability
  })

  const emergencyChefs = chefProfiles.filter(c => c.isHomechef && c.availability.includes('Full Day')).slice(0, 2)

  const handleOpenBookingModal = () => {
    if (!bookingPackage) {
      toast.error('Please choose a package before confirming booking.')
      return
    }
    if (!bookingDate) {
      toast.error('Please select a start date.')
      return
    }
    if (!bookingTime) {
      toast.error('Please select a preferred time.')
      return
    }
    setShowBooking(true)
  }

  const handleConfirmBooking = async () => {
    if (!selectedChef) return

    try {
      await api.post('/api/bookings', {
        chefId: String(selectedChef.id),
        packageName: bookingPackage,
        startDate: bookingDate,
        preferredTime: bookingTime,
      })

      toast.success(`Booking request sent to ${selectedChef.name}`)
      setShowBooking(false)
      setSelectedChef(null)
      setBookingPackage('')
      setBookingDate('')
      setBookingTime('')
      navigate('/dashboard?tab=bookings')
    } catch (error: any) {
      console.error('Failed to confirm booking', error)
      const message = error?.response?.data?.error || 'Failed to confirm booking. Please try again.'
      toast.error(message)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedChef) return

    if (!user?.id) {
      toast.error('Please login to leave a review')
      navigate('/login')
      return
    }

    if (!reviewComment.trim()) {
      toast.error('Please enter a short review comment')
      return
    }

    try {
      setSubmittingReview(true)
      const response = await api.post(`/api/users/${selectedChef.id}/review`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      })

      const newReview = response.data.review
      const previousCount = selectedChef.reviews || selectedChef.reviewsList.length
      const nextCount = previousCount + 1
      const nextRating = previousCount === 0
        ? reviewRating
        : Number(((selectedChef.rating * previousCount + reviewRating) / nextCount).toFixed(1))

      const mappedReview = {
        id: newReview?.id,
        user: newReview?.reviewer?.name || user.name || 'You',
        rating: Number(newReview?.rating) || reviewRating,
        text: newReview?.comment || reviewComment.trim(),
        createdAt: newReview?.createdAt,
      }

      const updatedReviews = [mappedReview, ...selectedChef.reviewsList]
      const updatedChef = {
        ...selectedChef,
        reviewsList: updatedReviews,
        reviews: nextCount,
        rating: nextRating,
      }

      setSelectedChef(updatedChef)
      setChefProfiles((prev) => prev.map((chef) => chef.id === selectedChef.id ? {
        ...chef,
        reviewsList: updatedReviews,
        reviews: nextCount,
        rating: nextRating,
      } : chef))
      setShowReviewDialog(false)
      setReviewComment('')
      setReviewRating(5)
      toast.success('Review submitted successfully')
    } catch (error: any) {
      console.error('Failed to submit review', error)
      const message = error?.response?.data?.error || 'Failed to submit review. Please try again.'
      toast.error(message)
    } finally {
      setSubmittingReview(false)
    }
  }

  const toggleSave = (chefId: string) => {
    setSavedChefs(prev => 
      prev.includes(chefId) ? prev.filter(id => id !== chefId) : [...prev, chefId]
    )
  }

  const handleEditChef = (chefId: string) => {
    if (!user || user.id !== chefId) return
    navigate('/profile/update')
  }

  const handleRemoveChef = async (chefId: string) => {
    if (!user || user.id !== chefId) return
    if (!window.confirm('Remove your Homechef listing? This action cannot be undone.')) return

    try {
      setRemovingChefId(chefId)
      await api.put('/api/users/profile', { isHomechef: false })
      setChefProfiles(prev => prev.filter((chef) => chef.id !== chefId))
      toast.success('Homechef listing removed successfully')
    } catch (error) {
      console.error('Failed to remove homechef listing', error)
      toast.error('Failed to remove homechef listing')
    } finally {
      setRemovingChefId(null)
    }
  }

  const handleShareChef = async (chef: Chef) => {
    const profileUrl = buildShareUrl(`/profile/${chef.id}`)
    const shareText = `Check out ${chef.name} on BachelorHub Homechef: ${profileUrl}`

    if (navigator.share) {
      try {
        await navigator.share({ title: chef.name, text: shareText, url: profileUrl })
        return
      } catch (e) {
        console.warn('Web share failed', e)
      }
    }

    try {
      await navigator.clipboard.writeText(shareText)
      toast.success('Chef profile link copied to clipboard')
    } catch (err) {
      console.error('Share failed', err)
      toast.error('Unable to share at this time')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {loading && (
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading homechefs...</p>
          </div>
        </div>
      )}
      {!loading && (
        <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Find Your Perfect Homechef</h1>
            <p className="text-gray-600 dark:text-gray-400">Hire verified homechefs for daily or occasional cooking</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {error && (
              <Button onClick={() => fetchHomechefs()} variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-300">
                <RotateCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            <Button onClick={() => navigate('/profile/update')} className="bg-green-600 hover:bg-green-700">
              <ChefHat className="w-4 h-4 mr-2" />
              Become a Chef
            </Button>
            {savedChefs.length > 0 && (
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" />
                Saved ({savedChefs.length})
              </Button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <Card className="p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">Unable to load homechefs</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Please try again later or refresh the page.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Search & Filters */}
        <Card className="p-6 mb-8 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Chef Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">All Locations</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Mirpur">Mirpur</option>
                <option value="Dhanmondi">Dhanmondi</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Cuisine</label>
              <select
                value={selectedCuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">All Cuisines</option>
                <option value="Bangladeshi">Bangladeshi</option>
                <option value="Indian">Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Continental">Continental</option>
                <option value="Healthy">Healthy</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Meal Type</label>
              <select
                value={selectedMealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">All Meals</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="All-day">All-day Cooking</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Budget</label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">All Budgets</option>
                <option value="under-3000">Under ৳3000</option>
                <option value="3000-5000">৳3000 - ৳5000</option>
                <option value="above-5000">Above ৳5000</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
              >
                <option value="">Any Time</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>{filteredChefs.length} chef(s) found</span>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('')
                setSelectedLocation('')
                setCuisine('')
                setMealType('')
                setBudgetRange('')
                setAvailability('')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Emergency Chef Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold">Need a Chef Today?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyChefs.map(chef => (
              <Card key={chef.id} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                <div className="flex gap-3">
                  <Avatar className="w-12 h-12">
                    {chef.avatar ? <AvatarImage src={chef.avatar} /> : null}
                    <AvatarFallback>{chef.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{chef.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Available now • ৳{chef.startingPrice}</p>
                  </div>
                  <Button onClick={() => setSelectedChef(chef)} className="bg-orange-600 hover:bg-orange-700">
                    Hire Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chef Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {filteredChefs.length > 0 ? (
            filteredChefs.map((chef, index) => (
              <motion.div
                key={chef.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition dark:bg-gray-800">
                  <div className="flex gap-4 mb-4">
                    <Avatar className="w-20 h-20">
                      {chef.avatar ? <AvatarImage src={chef.avatar} /> : null}
                      <AvatarFallback>{chef.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold">{chef.name}</h3>
                            {chef.verified && (
                              <div title="Verified Chef">
                                <Shield className="w-5 h-5 text-green-500" />
                              </div>
                            )}
                            {chef.topRated && (
                              <Badge className="bg-amber-500">⭐ Top Rated</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <MapPin className="w-4 h-4" />
                            {chef.location}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {user?.id === chef.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                  <MoreVertical className="w-5 h-5 text-gray-600" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleEditChef(chef.id)}>
                                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleRemoveChef(chef.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleShareChef(chef)}>
                                  <Share2 className="w-4 h-4 mr-2" /> Share
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          <button
                            onClick={() => toggleSave(chef.id)}
                            className="text-gray-400 hover:text-red-500 transition"
                            disabled={removingChefId === chef.id}
                          >
                            {savedChefs.includes(chef.id) ? (
                              <HeartSolid className="w-6 h-6 text-red-500" />
                            ) : (
                              <Heart className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{chef.rating}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">({chef.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <Briefcase className="inline w-4 h-4 mr-1" />
                        {chef.experience}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {chef.specialties.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Starting from</p>
                        <p className="text-lg font-bold text-green-600">৳{chef.startingPrice}</p>
                      </div>
                      <Button onClick={() => setSelectedChef(chef)} className="bg-green-600 hover:bg-green-700">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="col-span-2 p-12 text-center dark:bg-gray-800">
              <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">No chefs found matching your criteria</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try adjusting your filters</p>
            </Card>
          )}
        </div>

        {/* CTA */}
        <Card className="p-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Are you a Homechef?</h3>
          <p className="mb-4 opacity-90">Create your profile and start receiving bookings</p>
          <Button variant="secondary" size="lg" onClick={() => navigate('/profile/update')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Become a Chef Today
          </Button>
        </Card>
        </div>
      )}
      
      {/* Chef Detail Modal */}
      <AnimatePresence>
        {selectedChef && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedChef(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedChef.name}</h2>
                <button
                  onClick={() => setSelectedChef(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="w-full">
                <div className="grid w-full grid-cols-4 px-6 mt-4">
                  {['profile', 'packages', 'reviews', 'book'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === tab ? 'bg-background text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      {tab === 'profile' ? 'Profile' : tab === 'packages' ? 'Packages' : tab === 'reviews' ? 'Reviews' : 'Book'}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="flex gap-6">
                        <Avatar className="w-24 h-24">
                          {selectedChef.avatar ? <AvatarImage src={selectedChef.avatar} /> : null}
                          <AvatarFallback>{selectedChef.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-2xl font-bold">{selectedChef.name}</h3>
                            {selectedChef.verified && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold">{selectedChef.rating}</span>
                            <span className="text-gray-600 dark:text-gray-400">({selectedChef.reviews} reviews)</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">{selectedChef.bio}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 dark:bg-gray-700">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Experience</div>
                          <div className="font-bold">{selectedChef.experience}</div>
                        </Card>
                        <Card className="p-4 dark:bg-gray-700">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Starting Price</div>
                          <div className="font-bold text-green-600">৳{selectedChef.startingPrice}</div>
                        </Card>
                        <Card className="p-4 dark:bg-gray-700">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</div>
                          <div className="font-bold flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {selectedChef.location}
                          </div>
                        </Card>
                        <Card className="p-4 dark:bg-gray-700">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Schedule</div>
                          <div className="font-bold text-sm">{selectedChef.schedule}</div>
                        </Card>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedChef.specialties.map(s => (
                            <Badge key={s}>{s}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Foods They Can Cook</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedChef.foods.map(f => (
                            <Badge key={f} variant="secondary">{f}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold mb-3">Food Photos</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {selectedChef.photos.map((photo, idx) => (
                            <img key={idx} src={photo} alt="Food" className="w-full h-32 object-cover rounded-lg" />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'packages' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {selectedChef.packages.map((pkg, idx) => (
                          <Card key={idx} className="p-4 dark:bg-gray-700 hover:shadow-md transition cursor-pointer" onClick={() => { setBookingPackage(pkg.name) }}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-lg">{pkg.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">৳{pkg.price}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">/month</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Recent Reviews</h3>
                        <Button size="sm" onClick={() => {
                          if (!user?.id) {
                            toast.error('Please login to leave a review')
                            navigate('/login')
                            return
                          }
                          setShowReviewDialog(true)
                        }}>
                          Add Review
                        </Button>
                      </div>

                      {selectedChef.reviewsList.length > 0 ? (
                        selectedChef.reviewsList.map((review, idx) => (
                          <Card key={idx} className="p-4 dark:bg-gray-700">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-semibold">{review.user}</div>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">{review.text}</p>
                          </Card>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-8">No reviews yet</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'book' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Select Package</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                          value={bookingPackage}
                          onChange={(e) => setBookingPackage(e.target.value)}
                        >
                          <option value="">Choose a package</option>
                          {selectedChef.packages.map(pkg => (
                            <option key={pkg.name} value={pkg.name}>
                              {pkg.name} - ৳{pkg.price}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Preferred Time</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                        >
                          <option value="">Select a time</option>
                          <option value="Morning">Morning (8am - 12pm)</option>
                          <option value="Afternoon">Afternoon (12pm - 5pm)</option>
                          <option value="Evening">Evening (5pm - 9pm)</option>
                        </select>
                      </div>

                      <div className="pt-4 space-y-2">
                        <Button onClick={handleOpenBookingModal} className="w-full bg-green-600 hover:bg-green-700 py-6">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Confirm Booking
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate('/messenger', { state: { contactChatId: String(selectedChef.id) } })}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message Chef
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBooking && selectedChef && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBooking(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Confirm Booking</h2>
                  <p className="text-sm text-gray-500">Review and confirm your chef booking request.</p>
                </div>
                <button
                  onClick={() => setShowBooking(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                  <p className="text-sm text-gray-500">Chef</p>
                  <p className="font-semibold">{selectedChef.name}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                  <p className="text-sm text-gray-500">Package</p>
                  <p className="font-semibold">{bookingPackage || 'No package selected'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-semibold">{bookingDate || 'Not selected'}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                    <p className="text-sm text-gray-500">Preferred Time</p>
                    <p className="font-semibold">{bookingTime || 'Not selected'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConfirmBooking}>
                  Confirm Booking
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowBooking(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a review</DialogTitle>
            <DialogDescription>Share your experience with this homechef so others can learn from it.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className="rounded-full p-1 transition hover:scale-110"
                >
                  <Star className={`w-6 h-6 ${value <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>

            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write a short review about your experience..."
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RoommateFinder