import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, X, Plus, MapPin, DollarSign, Users, Calendar,
  Wifi, Coffee, Car, Shield, Utensils, Wind, Tv, Microwave
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const CreateListing = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    rent: '',
    availableSeats: '',
    phone: '',
    genderPreference: 'any',
    furnishing: 'unfurnished',
    availableFrom: '',
    facilities: [] as string[],
    rules: [] as string[],
    photos: [] as File[],
  })

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles) => {
      setFormData({ ...formData, photos: [...formData.photos, ...acceptedFiles] })
    },
  })

  const facilitiesList = [
    { id: 'wifi', name: 'WiFi', icon: Wifi },
    { id: 'ac', name: 'AC', icon: Wind },
    { id: 'geyser', name: 'Geyser', icon: Coffee },
    { id: 'kitchen', name: 'Kitchen', icon: Utensils },
    { id: 'parking', name: 'Parking', icon: Car },
    { id: 'security', name: 'Security Camera', icon: Shield },
    { id: 'tv', name: 'TV', icon: Tv },
    { id: 'microwave', name: 'Microwave', icon: Microwave },
  ]

  const facilityMap = Object.fromEntries(
    facilitiesList.map((facility) => [facility.id, facility.name])
  )

  const toggleFacility = (facilityId: string) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.includes(facilityId)
        ? formData.facilities.filter(f => f !== facilityId)
        : [...formData.facilities, facilityId]
    })
  }

  const goToPreviousStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const goToNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const resizeImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const scale = Math.min(1, maxWidth / img.width)
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')
          if (!ctx) return reject(new Error('Canvas unsupported'))
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', quality)
            resolve(dataUrl)
          } catch (err) {
            reject(err)
          }
        }
        img.onerror = () => reject(new Error('Image load error'))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!user?.id) {
        toast.error('You must be logged in to create a listing')
        return
      }

      // Resize and persist up to 5 images to keep localStorage usage reasonable
      const MAX_PHOTOS = 5
      const filesToProcess = formData.photos.slice(0, MAX_PHOTOS)

      const resizedUrls: string[] = []
      for (const file of filesToProcess) {
        try {
          // use medium quality to reduce size
          const url = await resizeImage(file, 1200, 0.75)
          resizedUrls.push(url)
        } catch (err) {
          console.warn('Failed to process image', err)
        }
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        rent: Number(formData.rent) || 0,
        priceValue: Number(formData.rent) || 0,
        availableSeats: Number(formData.availableSeats) || 1,
        phone: formData.phone || undefined,
        genderPreference: formData.genderPreference,
        furnishing: formData.furnishing,
        availableFrom: formData.availableFrom || undefined,
        features: formData.facilities.map((facilityId) => facilityMap[facilityId] || facilityId),
        rules: formData.rules,
        photos: resizedUrls,
      }

      await api.post('/api/listings', payload)
      toast.success('Listing created successfully!')
      navigate('/feed')
    } catch (error) {
      console.error('Failed to save listing', error)
      toast.error('Failed to create listing')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-2xl font-bold">Create New Listing</h1>
            <p className="mt-1 opacity-90">List your property for rent</p>
          </div>

          {/* Steps */}
          <div className="flex border-b">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 py-3 text-center font-medium transition ${
                  step === s
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s === 1 && 'Basic Info'}
                {s === 2 && 'Facilities & Rules'}
                {s === 3 && 'Photos'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Cozy Single Room in Mirpur"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your property..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Area, City"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent (BDT) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        value={formData.rent}
                        onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="6000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Seats *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        value={formData.availableSeats}
                        onChange={(e) => setFormData({ ...formData, availableSeats: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender Preference
                    </label>
                    <select
                      value={formData.genderPreference}
                      onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="any">Any</option>
                      <option value="male">Male Only</option>
                      <option value="female">Female Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Furnishing Status
                    </label>
                    <select
                      value={formData.furnishing}
                      onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="unfurnished">Unfurnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="fully-furnished">Fully Furnished</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available From *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Facilities & Rules */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Facilities & Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {facilitiesList.map((facility) => (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => toggleFacility(facility.id)}
                        className={`flex items-center gap-2 p-3 border rounded-lg transition ${
                          formData.facilities.includes(facility.id)
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <facility.icon className="w-4 h-4" />
                        <span className="text-sm">{facility.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Rules
                  </label>
                  <div className="space-y-2">
                    {['No Smoking', 'No Pets', 'No Visitors After 10 PM', 'No Loud Music', 'Keep Clean'].map((rule) => (
                      <label key={rule} className="flex items-center">
                        <input
                          type="checkbox"
                          value={rule}
                          checked={formData.rules.includes(rule)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, rules: [...formData.rules, rule] })
                            } else {
                              setFormData({ ...formData, rules: formData.rules.filter(r => r !== rule) })
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{rule}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Photos */}
            {step === 3 && (
              <div className="space-y-6">
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Drag & drop photos here, or click to select</p>
                  <p className="text-sm text-gray-500 mt-1">Upload up to 10 photos (any image format is supported)</p>
                </div>

                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={goToPreviousStep}>
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={goToNextStep} className="ml-auto">
                  Next
                </Button>
              ) : (
                <Button type="submit" className="ml-auto bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Publish Listing
                </Button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default CreateListing