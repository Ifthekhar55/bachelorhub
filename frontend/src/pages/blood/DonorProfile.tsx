import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { 
  Droplet, Calendar, Heart, 
  CheckCircle, Edit2, Save, X
} from 'lucide-react'

interface DonorProfileData {
  id: string
  userId: string
  bloodGroup: string
  lastDonationDate: string | null
  weight: number | null
  age: number | null
  city: string | null
  area: string | null
  phoneVisible: boolean
  isVerified: boolean
  totalDonations: number
  availabilityStatus: boolean
  user: {
    name: string
    email: string
    phone: string
  }
}

const DonorProfile = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<DonorProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    bloodGroup: '',
    weight: '',
    age: '',
    city: '',
    area: '',
    phoneVisible: true,
    availabilityStatus: true,
    totalDonations: 0,
    lastDonationDate: '',
  })

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching donor profile...')
      const response = await api.get('/api/blood/donor-profile')
      console.log('📥 Fetched profile data:', response.data)
      
      if (response.data) {
        setProfile(response.data)
        setFormData({
          bloodGroup: response.data.bloodGroup || '',
          weight: response.data.weight?.toString() || '',
          age: response.data.age?.toString() || '',
          city: response.data.city || '',
          area: response.data.area || '',
          phoneVisible: response.data.phoneVisible !== false,
          availabilityStatus: response.data.availabilityStatus !== false,
          totalDonations: response.data.totalDonations || 0,
          lastDonationDate: response.data.lastDonationDate 
            ? new Date(response.data.lastDonationDate).toISOString().split('T')[0] 
            : '',
        })
      } else {
        setProfile(null)
        setFormData({
          bloodGroup: '',
          weight: '',
          age: '',
          city: '',
          area: '',
          phoneVisible: true,
          availabilityStatus: true,
          totalDonations: 0,
          lastDonationDate: '',
        })
      }
    } catch (err) {
      console.error('❌ Failed to fetch donor profile:', err)
      if ((err as any)?.response?.status !== 404) {
        toast.error('Failed to load donor profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      if (formData.totalDonations < 0) {
        toast.error('Total donations cannot be negative')
        return
      }

      const payload = {
        bloodGroup: formData.bloodGroup,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        age: formData.age ? parseInt(formData.age) : null,
        city: formData.city,
        area: formData.area,
        phoneVisible: formData.phoneVisible,
        availabilityStatus: formData.availabilityStatus,
        totalDonations: formData.totalDonations || 0,
        lastDonationDate: formData.lastDonationDate 
          ? new Date(formData.lastDonationDate).toISOString() 
          : null,
      }

      console.log('💾 Saving donor profile:', payload)

      const response = await api.post('/api/blood/donor-profile', payload)
      
      console.log('✅ Save response:', response.data)

      if (response.data) {
        const updatedProfile = {
          ...response.data,
          user: response.data.user || profile?.user || {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
          }
        }
        
        console.log('🔄 Setting profile to:', updatedProfile)
        setProfile(updatedProfile)
        
        setFormData({
          bloodGroup: updatedProfile.bloodGroup || '',
          weight: updatedProfile.weight?.toString() || '',
          age: updatedProfile.age?.toString() || '',
          city: updatedProfile.city || '',
          area: updatedProfile.area || '',
          phoneVisible: updatedProfile.phoneVisible !== false,
          availabilityStatus: updatedProfile.availabilityStatus !== false,
          totalDonations: updatedProfile.totalDonations || 0,
          lastDonationDate: updatedProfile.lastDonationDate 
            ? new Date(updatedProfile.lastDonationDate).toISOString().split('T')[0] 
            : '',
        })
        
        toast.success('Donor profile saved successfully!')
        setIsEditing(false)
      }
    } catch (err: any) {
      console.error('❌ Error saving donor profile:', err.response?.data || err.message)
      toast.error(err.response?.data?.error || 'Failed to save donor profile')
    }
  }

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !profile?.availabilityStatus
      
      const response = await api.put('/api/blood/donor-profile', {
        availabilityStatus: newStatus,
      })
      
      console.log('🔄 Availability toggled:', response.data)
      
      if (response.data) {
        setProfile(prev => ({
          ...prev!,
          ...response.data,
          user: response.data.user || prev?.user
        }))
      }
      
      toast.success(newStatus ? 'You are now available to donate!' : 'You are now unavailable')
    } catch (err) {
      toast.error('Failed to update availability')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading donor profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                {profile?.user?.name?.charAt(0) || user?.name?.charAt(0) || 'D'}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{profile?.user?.name || user?.name || 'Donor'}</h1>
                <p className="text-red-100">
                  {profile?.isVerified && '✓ Verified Donor • '}
                  Blood Type: <span className="font-bold text-xl">{profile?.bloodGroup || 'Not Set'}</span>
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                profile?.availabilityStatus ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {profile?.availabilityStatus ? 'Available' : 'Unavailable'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Edit Donor Profile</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Blood Group *</Label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full p-2 border rounded-lg mt-1"
                      required
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="e.g., 65"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="e.g., 25"
                      min="16"
                      max="120"
                    />
                  </div>

                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Dhaka"
                    />
                  </div>

                  <div>
                    <Label>Area</Label>
                    <Input
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g., Mirpur"
                    />
                  </div>

                  {/* Total Donations Field */}
                  <div>
                    <Label>Total Donations</Label>
                    <Input
                      type="number"
                      value={formData.totalDonations}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        totalDonations: Math.max(0, parseInt(e.target.value) || 0) 
                      })}
                      placeholder="e.g., 5"
                      min="0"
                      className="border-blue-200 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total number of times you've donated blood
                    </p>
                  </div>

                  {/* Last Donation Date Field */}
                  <div>
                    <Label>Last Donation Date</Label>
                    <Input
                      type="date"
                      value={formData.lastDonationDate}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        lastDonationDate: e.target.value 
                      })}
                      className="border-blue-200 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When was your last blood donation?
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.phoneVisible}
                        onChange={(e) => setFormData({ ...formData, phoneVisible: e.target.checked })}
                      />
                      Show phone number to requesters
                    </label>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.availabilityStatus}
                        onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.checked })}
                      />
                      Available to donate
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSaveProfile} className="bg-red-600 hover:bg-red-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false)
                    if (profile) {
                      setFormData({
                        bloodGroup: profile.bloodGroup || '',
                        weight: profile.weight?.toString() || '',
                        age: profile.age?.toString() || '',
                        city: profile.city || '',
                        area: profile.area || '',
                        phoneVisible: profile.phoneVisible !== false,
                        availabilityStatus: profile.availabilityStatus !== false,
                        totalDonations: profile.totalDonations || 0,
                        lastDonationDate: profile.lastDonationDate 
                          ? new Date(profile.lastDonationDate).toISOString().split('T')[0] 
                          : '',
                      })
                    }
                  }}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 text-center">
                    <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Total Donations</p>
                    <p className="text-3xl font-bold text-red-600">{profile?.totalDonations || 0}</p>
                  </Card>

                  <Card className="p-4 text-center">
                    <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Last Donation</p>
                    <p className="text-lg font-semibold">
                      {profile?.lastDonationDate
                        ? new Date(profile.lastDonationDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Never'}
                    </p>
                  </Card>

                  <Card className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Status</p>
                    <p className="text-lg font-semibold text-green-600">
                      {profile?.availabilityStatus ? '✅ Available' : '⛔ Unavailable'}
                    </p>
                  </Card>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-2 font-medium">
                        {profile?.phoneVisible ? profile?.user?.phone || user?.phone : 'Hidden'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-2 font-medium">
                        {profile?.city || 'Not specified'}{profile?.area ? `, ${profile.area}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Weight:</span>
                      <span className="ml-2 font-medium">{profile?.weight || 'Not specified'} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Age:</span>
                      <span className="ml-2 font-medium">{profile?.age || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Donations:</span>
                      <span className="ml-2 font-medium">{profile?.totalDonations || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Donation:</span>
                      <span className="ml-2 font-medium">
                        {profile?.lastDonationDate
                          ? new Date(profile.lastDonationDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t flex-wrap">
                  <Button onClick={() => setIsEditing(true)} className="bg-red-600 hover:bg-red-700">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    onClick={handleToggleAvailability}
                    variant={profile?.availabilityStatus ? 'outline' : 'default'}
                    className={profile?.availabilityStatus ? '' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {profile?.availabilityStatus ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/blood-requests')}>
                    <Droplet className="w-4 h-4 mr-2" />
                    View Requests
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DonorProfile