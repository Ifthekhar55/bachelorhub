import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save, Trash2, Upload, X, MapPin, DollarSign, Users, Calendar } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Button } from '../../components/ui/button'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const EditListing = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    location: '',
    rent: '',
    availableSeats: '',
    genderPreference: 'any',
    furnishing: 'unfurnished',
    availableFrom: '',
    facilities: [] as string[],
    rules: [] as string[],
    photos: [] as string[], // data URLs
  })
  const [sizeWarning, setSizeWarning] = useState<string | null>(null)
  const MAX_TOTAL_SIZE = 15 * 1024 * 1024 // 15MB limit for safety (20MB backend limit)

  const resizeImage = (file: File, maxWidth = 1200, quality = 0.75): Promise<string> => {
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

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: async (acceptedFiles) => {
      const urls: string[] = []
      let totalSize = formData.photos.reduce((sum: number, photo: string) => sum + photo.length, 0)
      let hasExceeded = false

      for (const f of acceptedFiles.slice(0, 5)) {
        try {
          const u = await resizeImage(f as File)
          totalSize += u.length

          if (totalSize > MAX_TOTAL_SIZE) {
            hasExceeded = true
            toast.error('Photos exceed maximum total size. Please remove some photos.')
            break
          }

          urls.push(u)
        } catch (err) {
          console.warn('drop resize failed', err)
          toast.error('Failed to process image')
        }
      }

      if (hasExceeded) {
        setSizeWarning(`Current size: ${(totalSize / 1024 / 1024).toFixed(1)}MB / ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)}MB limit`)
        return
      }

      setSizeWarning(null)
      setFormData((prev: any) => ({ ...prev, photos: [...prev.photos, ...urls].slice(0, 5) }))
    },
  })

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await api.get(`/api/listings/${id}`)
        const found = response.data

        setFormData({
          title: found.title ?? '',
          description: found.description ?? '',
          location: found.location ?? '',
          rent: String(found.rent ?? found.priceValue ?? ''),
          availableSeats: String(found.availableSeats ?? ''),
          genderPreference: found.genderPreference ?? found.gender ?? 'any',
          furnishing: found.furnishing ?? 'unfurnished',
          availableFrom: found.availableFrom
            ? new Date(found.availableFrom).toISOString().slice(0, 10)
            : '',
          facilities: found.features ?? found.facilities ?? [],
          rules: found.rules ?? [],
          photos: Array.isArray(found.photos) && found.photos.length > 0 ? found.photos : [],
        })
      } catch (error) {
        console.error('Failed to load listing for edit', error)
        toast.error('Unable to load listing')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchListing()
    } else {
      setLoading(false)
    }
  }, [id])

  const removePhoto = (index: number) => {
    setFormData((prev: any) => ({ ...prev, photos: prev.photos.filter((_: any, i: number) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        rent: Number(formData.rent) || 0,
        priceValue: Number(formData.rent) || 0,
        availableSeats: Number(formData.availableSeats) || 1,
        genderPreference: formData.genderPreference,
        furnishing: formData.furnishing,
        availableFrom: formData.availableFrom || undefined,
        features: formData.facilities,
        rules: formData.rules,
        photos: formData.photos,
      }

      await api.put(`/api/listings/${id}`, payload)
      toast.success('Listing updated successfully!')
      navigate(`/listing/${id}`)
    } catch (err) {
      console.error('update failed', err)
      toast.error('Failed to update listing')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      await api.delete(`/api/listings/${id}`)
      toast.success('Listing deleted')
      navigate('/feed')
    } catch (error) {
      console.error('Failed to delete listing', error)
      toast.error('Failed to delete listing')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-2xl font-bold">Edit Listing</h1>
            <p className="mt-1 opacity-90">Update your property details</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Listing Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Area, City" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent (BDT) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="number" value={formData.rent} onChange={(e) => setFormData({ ...formData, rent: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="6000" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Seats *</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="number" value={formData.availableSeats} onChange={(e) => setFormData({ ...formData, availableSeats: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="1" required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Facilities & Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['WiFi','Attached Bath','AC','Kitchen','Parking','Security Camera','TV','Microwave'].map((f) => (
                      <button key={f} type="button" onClick={() => setFormData((p:any)=>({ ...p, facilities: p.facilities.includes(f)? p.facilities.filter((x:string)=>x!==f): [...p.facilities,f]}))} className={`flex items-center gap-2 p-3 border rounded-lg transition ${formData.facilities.includes(f)? 'border-blue-500 bg-blue-50 text-blue-600':'border-gray-300 hover:border-blue-300'}`}>
                        <span className="text-sm">{f}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">House Rules</label>
                  <div className="space-y-2">
                    {['No Smoking','No Pets','No Visitors After 10 PM','No Loud Music','Keep Clean'].map((rule)=> (
                      <label key={rule} className="flex items-center">
                        <input type="checkbox" checked={formData.rules.includes(rule)} onChange={(e)=> setFormData((p:any)=>({ ...p, rules: e.target.checked? [...p.rules, rule]: p.rules.filter((r:string)=>r!==rule) }))} className="mr-3" />
                        <span className="text-gray-700">{rule}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {sizeWarning && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-800">
                    <p className="font-semibold">⚠️ Upload Size Warning</p>
                    <p className="text-sm mt-1">{sizeWarning}</p>
                  </div>
                )}
                <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Drag & drop photos here, or click to select</p>
                  <p className="text-sm text-gray-500 mt-1">Upload up to 5 photos</p>
                </div>

                {formData.photos.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-3">
                      Total size: {((formData.photos.reduce((sum: number, photo: string) => sum + photo.length, 0)) / 1024 / 1024).toFixed(1)}MB / {(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)}MB
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {formData.photos.map((p:string, idx:number)=> (
                        <div key={idx} className="relative group">
                          <img src={p} alt={`Preview ${idx}`} className="w-full h-32 object-cover rounded-lg" />
                          <button type="button" onClick={()=> removePhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {step > 1 && (<Button type="button" variant="outline" onClick={()=> setStep(s=> Math.max(1,s-1))}>Previous</Button>)}
              {step < 3 ? (
                <Button type="button" onClick={()=> setStep(s=> Math.min(3,s+1))} className="ml-auto">Next</Button>
              ) : (
                <div className="flex gap-3 ml-auto">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2"/> Delete</Button>
                </div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default EditListing