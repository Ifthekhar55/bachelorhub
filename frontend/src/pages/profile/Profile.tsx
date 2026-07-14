import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, Calendar, Shield, Settings,
  Edit2, Camera, CheckCircle, XCircle, Save, X,
  Globe, Briefcase, GraduationCap, Heart, Star,
  MessageCircle, Users, Home, DollarSign, FileText, Bell
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import NotificationsModal from '../../components/modals/NotificationsModal'
import { Card } from '../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isVerified: boolean
  verificationStatus: string
  profilePhoto?: string
  bio?: string
  location?: string
  occupation?: string
  education?: string
  interests?: string[]
  specialties?: string[]
  foods?: string[]
  experience?: string
  servingArea?: string
  foodPhotos?: string[]
  schedule?: string
  packages?: { name: string; price: number; description: string }[]
  startingPrice?: number
  isHomechef?: boolean
  memberSince: string
  listingsCount?: number
  reviewsCount?: number
  rating?: number
}

interface EditForm {
  name: string
  bio: string
  location: string
  occupation: string
  education: string
  interests: string
  specialties?: string
  experience?: string
  servingArea?: string
  foods?: string
  schedule?: string
  packages?: string
}

const Profile = ({ forceEdit = false }: { forceEdit?: boolean }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({
    name: '',
    bio: '',
    location: '',
    occupation: '',
    education: '',
    interests: ''
  })
  const [packages, setPackages] = useState<{ name: string; price: number; description: string }[]>([])
  const [newPackage, setNewPackage] = useState({ name: '', price: '', description: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteProfilePhoto, setDeleteProfilePhoto] = useState(false)
  const [selectedFoodFiles, setSelectedFoodFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const isOwnProfile = !id || id === currentUser?.id

  // Check if all required homechef fields are filled
  const isHomechefComplete = () => {
    return (
      (editForm as any).experience?.trim() !== '' &&
      (editForm as any).servingArea?.trim() !== '' &&
      (editForm as any).schedule?.trim() !== '' &&
      packages.length > 0
    )
  }

  useEffect(() => {
    fetchProfile()
  }, [id, currentUser])

  useEffect(() => {
    if (forceEdit && isOwnProfile) {
      setIsEditing(true)
    }
  }, [forceEdit, isOwnProfile])

  useEffect(() => {
    if (searchParams.get('showNotifications') === 'true') {
      setShowNotificationsModal(true)
    }
  }, [searchParams])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const userId = id || currentUser?.id
      if (!userId) {
        return
      }
      const response = await api.get(`/api/users/profile/${userId}`)
      const data = response.data || {}

      // Normalize interests and homechef arrays to arrays
      let interestsArr: string[] = []
      if (Array.isArray(data.interests)) interestsArr = data.interests
      else if (typeof data.interests === 'string') {
        try {
          interestsArr = JSON.parse(data.interests)
        } catch (e) {
          interestsArr = data.interests.length ? data.interests.split(',').map((s: string) => s.trim()) : []
        }
      }

      let specialtiesArr: string[] = []
      if (Array.isArray(data.specialties)) specialtiesArr = data.specialties
      else if (typeof data.specialties === 'string') {
        try {
          specialtiesArr = JSON.parse(data.specialties)
        } catch (e) {
          specialtiesArr = data.specialties.length ? data.specialties.split(',').map((s: string) => s.trim()) : []
        }
      }

      let foodsArr: string[] = []
      if (Array.isArray(data.foods)) foodsArr = data.foods
      else if (typeof data.foods === 'string') {
        try {
          foodsArr = JSON.parse(data.foods)
        } catch (e) {
          foodsArr = data.foods.length ? data.foods.split(',').map((s: string) => s.trim()) : []
        }
      }

      // Parse packages if they exist
      let packagesArr: { name: string; price: number; description: string }[] = []
      if (Array.isArray(data.packages)) packagesArr = data.packages
      else if (typeof data.packages === 'string') {
        try {
          packagesArr = JSON.parse(data.packages)
        } catch (e) {
          packagesArr = []
        }
      }

      // Calculate starting price (lowest package price)
      const startingPrice = packagesArr.length > 0 
        ? Math.min(...packagesArr.map((p: any) => p.price || 0))
        : 0

      const normalized = {
        ...data,
        interests: interestsArr,
        specialties: specialtiesArr,
        foods: foodsArr,
        packages: packagesArr,
        schedule: data.schedule || '',
        experience: data.experience || '',
        servingArea: data.servingArea || '',
        startingPrice,
        isHomechef: data.isHomechef || false,
        listingsCount: Number(data.listingsCount) || 0,
        reviewsCount: Number(data.reviewsCount) || 0,
        rating: Number(data.rating) || 0,
        memberSince: data.memberSince || data.createdAt,
      }

      setProfile(normalized)
      setEditForm({
        name: normalized.name || '',
        bio: normalized.bio || '',
        location: normalized.location || '',
        occupation: normalized.occupation || '',
        education: normalized.education || '',
        interests: normalized.interests?.join(', ') || '',
        // homechef specific (store as comma-separated strings in the form)
        specialties: Array.isArray(normalized.specialties) ? normalized.specialties.join(', ') : (normalized.specialties || ''),
        experience: normalized.experience || '',
        servingArea: normalized.servingArea || '',
        foods: Array.isArray(normalized.foods) ? normalized.foods.join(', ') : (normalized.foods || ''),
        schedule: normalized.schedule || ''
      })
      setPackages(packagesArr)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData()
      formData.append('name', editForm.name)
      formData.append('bio', editForm.bio)
      formData.append('location', editForm.location)
      formData.append('occupation', editForm.occupation)
      formData.append('education', editForm.education)
      formData.append('interests', editForm.interests)
      // Homechef fields
      formData.append('specialties', (editForm as any).specialties || '')
      formData.append('experience', (editForm as any).experience || '')
      formData.append('servingArea', (editForm as any).servingArea || '')
      formData.append('foods', (editForm as any).foods || '')
      formData.append('schedule', (editForm as any).schedule || '')
      formData.append('packages', packages.length > 0 ? JSON.stringify(packages) : '')
      // Auto-mark as homechef if all required fields are filled
      formData.append('isHomechef', isHomechefComplete() ? 'true' : 'false')
      
      if (deleteProfilePhoto) {
        formData.append('removeProfilePhoto', 'true')
      } else if (selectedFile) {
        formData.append('profilePhoto', selectedFile)
      }
      if (selectedFoodFiles && selectedFoodFiles.length > 0) {
        selectedFoodFiles.forEach((f) => formData.append('foodPhotos', f))
      }

      const response = await api.put('/api/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const updatedUserData = response.data.user
      setProfile(updatedUserData)
      
      // Update auth store so Navbar reflects the changes
      currentUser && useAuthStore.setState({ 
        user: { 
          ...currentUser, 
          profilePhoto: updatedUserData.profilePhoto,
          name: updatedUserData.name
        } 
      })
      
      setIsEditing(false)
      setSelectedFile(null)
      setDeleteProfilePhoto(false)
      if (isHomechefComplete()) {
        toast.success('Congratulations! You are now a Homechef! 🎉')
      } else {
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setDeleteProfilePhoto(false)
    }
  }

  const handleViewProfilePhoto = () => {
    const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : profile?.profilePhoto

    if (!previewUrl) {
      toast.error('No profile photo available yet')
      return
    }

    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDeleteProfilePhoto = () => {
    setSelectedFile(null)
    setDeleteProfilePhoto(true)
    toast.success('Profile photo will be removed when you save changes')
  }

  const handleFoodFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFoodFiles(Array.from(e.target.files))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const closeNotificationsModal = () => {
    setShowNotificationsModal(false)
    if (searchParams.get('showNotifications') === 'true') {
      const params = new URLSearchParams(searchParams)
      params.delete('showNotifications')
      setSearchParams(params, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Cover Section */}
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl"></div>
            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900 shadow-xl">
                  {selectedFile ? (
                    <AvatarImage src={URL.createObjectURL(selectedFile)} className="object-cover" />
                  ) : !deleteProfilePhoto && profile.profilePhoto ? (
                    <AvatarImage src={profile.profilePhoto} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-4xl font-bold">
                    {profile.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && isEditing && (
                  <div className="absolute bottom-0 right-0 flex flex-col gap-2">
                    <label className="bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700 transition shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input ref={profilePhotoInputRef} type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            {isOwnProfile && !isEditing && (
              <div className="absolute top-4 right-4">
                <Button onClick={() => setIsEditing(true)} variant="secondary" className="shadow-md">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mt-16 p-6">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-6">
                <div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                    <h2 className="text-2xl font-bold">Edit Profile</h2>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={handleViewProfilePhoto}>
                        View Photo
                      </Button>
                      <Button type="button" variant="outline" onClick={() => profilePhotoInputRef.current?.click()}>
                        Upload Photo
                      </Button>
                      <Button type="button" variant="outline" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDeleteProfilePhoto}>
                        Delete Photo
                      </Button>
                    </div>
                  </div>
                  
                  {/* Homechef Completion Status */}
                  <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Become a Homechef</h3>
                      {isHomechefComplete() ? (
                        <Badge className="bg-green-500">✓ Complete</Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {(editForm as any).experience?.trim() ? '✓' : '○'} Experience
                      </div>
                      <div className="flex items-center gap-2">
                        {(editForm as any).servingArea?.trim() ? '✓' : '○'} Serving Area
                      </div>
                      <div className="flex items-center gap-2">
                        {(editForm as any).schedule?.trim() ? '✓' : '○'} Schedule
                      </div>
                      <div className="flex items-center gap-2">
                        {packages.length > 0 ? '✓' : '○'} Packages ({packages.length})
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="e.g., Dhaka, Bangladesh"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Occupation</Label>
                    <Input
                      value={editForm.occupation}
                      onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                      placeholder="e.g., Software Engineer"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Education</Label>
                    <Input
                      value={editForm.education}
                      onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                      placeholder="e.g., BSc in CSE"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Interests (comma separated)</Label>
                  <Input
                    value={editForm.interests}
                    onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                    placeholder="e.g., Reading, Travel, Music"
                    className="mt-1"
                  />
                </div>

                {/* Homechef fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Specialties (comma separated)</Label>
                    <Input
                      value={(editForm as any).specialties || ''}
                      onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                      placeholder="e.g., Biryani, Desserts"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Serving Area</Label>
                    <Input
                      value={(editForm as any).servingArea || ''}
                      onChange={(e) => setEditForm({ ...editForm, servingArea: e.target.value })}
                      placeholder="e.g., Dhanmondi, Dhaka"
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Experience</Label>
                    <Textarea
                      value={(editForm as any).experience || ''}
                      onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                      placeholder="Describe your cooking experience"
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Foods You Can Cook (comma separated)</Label>
                    <Input
                      value={(editForm as any).foods || ''}
                      onChange={(e) => setEditForm({ ...editForm, foods: e.target.value })}
                      placeholder="e.g., Chicken Biryani, Rosogolla"
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Schedule</Label>
                    <Input
                      value={(editForm as any).schedule || ''}
                      onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })}
                      placeholder="e.g., Mon-Fri: 10am-9pm, Sat-Sun: 12pm-8pm"
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="mb-3 block">Packages</Label>
                    <div className="space-y-3">
                      {packages.map((pkg, idx) => (
                        <Card key={idx} className="p-4 dark:bg-gray-700 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{pkg.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
                            <p className="text-lg font-bold text-green-600 mt-1">৳{pkg.price}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPackages(packages.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Remove
                          </Button>
                        </Card>
                      ))}

                      <Card className="p-4 dark:bg-gray-700 border-dashed">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Package Name</Label>
                            <Input
                              value={newPackage.name}
                              onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                              placeholder="e.g., Lunch Only"
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Price</Label>
                              <Input
                                type="number"
                                value={newPackage.price}
                                onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                                placeholder="e.g., 2500"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Description</Label>
                              <Input
                                value={newPackage.description}
                                onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                                placeholder="e.g., One meal per day"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              if (newPackage.name && newPackage.price && newPackage.description) {
                                setPackages([
                                  ...packages,
                                  {
                                    name: newPackage.name,
                                    price: parseInt(newPackage.price),
                                    description: newPackage.description
                                  }
                                ])
                                setNewPackage({ name: '', price: '', description: '' })
                                toast.success('Package added!')
                              } else {
                                toast.error('Please fill all fields')
                              }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Add Package
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Photos of cooked food</Label>
                    <input type="file" accept="image/*" multiple onChange={handleFoodFilesChange} className="mt-2" />
                    {selectedFoodFiles.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {selectedFoodFiles.map((f, idx) => (
                          <img key={idx} src={URL.createObjectURL(f)} alt={f.name} className="w-20 h-20 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold">{profile.name}</h1>
                      {profile.isVerified && (
                        <Badge className="bg-green-500">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {profile.isHomechef && (
                        <Badge className="bg-orange-500">
                          🍳 Homechef
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
                      {profile.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{profile.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Joined {new Date(profile.memberSince).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {profile.role && profile.role !== 'tenant' && (
                          <Badge className="bg-blue-500 text-white">
                            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <div className="flex gap-2 mt-4 md:mt-0 flex-wrap">
                      <Button variant="outline" onClick={() => navigate('/messenger')}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                      </Button>
                      <Button variant="outline" onClick={() => setShowNotificationsModal(true)}>
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="about">About</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>

                    <TabsContent value="about" className="space-y-4">
                      {profile.bio && (
                        <div>
                          <h3 className="font-semibold mb-2">About Me</h3>
                          <p className="text-gray-600 dark:text-gray-400">{profile.bio}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.occupation && (
                          <div className="flex items-start gap-3">
                            <Briefcase className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Occupation</p>
                              <p className="font-medium">{profile.occupation}</p>
                            </div>
                          </div>
                        )}
                        {profile.education && (
                          <div className="flex items-start gap-3">
                            <GraduationCap className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Education</p>
                              <p className="font-medium">{profile.education}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{profile.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{profile.phone}</p>
                          </div>
                        </div>
                      </div>

                      {profile.interests && profile.interests.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Interests</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.interests.map((interest, index) => (
                              <Badge key={index} variant="secondary" className="text-sm">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.specialties && profile.specialties.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Specialties</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.specialties.map((s: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-sm">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.foods && profile.foods.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Foods</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.foods.map((f: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-sm">{f}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.servingArea && (
                        <div>
                          <h3 className="font-semibold mb-2">Serving Area</h3>
                          <p className="text-gray-600">{profile.servingArea}</p>
                        </div>
                      )}

                      {profile.schedule && (
                        <div>
                          <h3 className="font-semibold mb-2">Schedule</h3>
                          <p className="text-gray-600 dark:text-gray-400">{profile.schedule}</p>
                        </div>
                      )}

                      {profile.startingPrice !== undefined && profile.startingPrice > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Starting Price</h3>
                          <p className="text-lg font-bold text-green-600">৳{profile.startingPrice}</p>
                        </div>
                      )}

                      {profile.packages && profile.packages.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Packages</h3>
                          <div className="grid grid-cols-1 gap-3">
                            {profile.packages.map((pkg: any, idx: number) => (
                              <Card key={idx} className="p-3 dark:bg-gray-700">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{pkg.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
                                  </div>
                                  <p className="text-lg font-bold text-green-600">৳{pkg.price}</p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="activity">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Card className="p-4 text-center">
                          <Home className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{profile.listingsCount || 0}</div>
                          <div className="text-sm text-gray-500">Properties Listed</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{profile.rating || 0}</div>
                          <div className="text-sm text-gray-500">Rating</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{profile.reviewsCount || 0}</div>
                          <div className="text-sm text-gray-500">Reviews</div>
                        </Card>
                        <Card className="p-4 text-center">
                          <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold">0</div>
                          <div className="text-sm text-gray-500">Saved Listings</div>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="reviews">
                      {profile.reviewsCount && profile.reviewsCount > 0 ? (
                        <div className="space-y-4">
                          {/* Reviews would be mapped here */}
                          <p className="text-center text-gray-500">Reviews coming soon...</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No reviews yet</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={closeNotificationsModal}
      />
    </div>
  )
}

export default Profile