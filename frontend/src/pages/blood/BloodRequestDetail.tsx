import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface BloodRequest {
  id: string
  bloodGroup: string
  unitsNeeded: number
  patientName: string | null
  hospitalName: string
  hospitalAddress: string
  requiredDate: string
  emergencyLevel: 'urgent' | 'within_24_hours' | 'planned'
  contactNumber: string
  additionalNotes: string | null
  location: string
  createdAt: string
  requester: {
    id: string
    name: string
    phone: string
    isVerified: boolean
  }
}

const emergencyLabel = (level: BloodRequest['emergencyLevel']) => {
  if (level === 'urgent') return 'Urgent'
  if (level === 'within_24_hours') return 'Within 24 Hours'
  return 'Planned'
}

export default function BloodRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bloodRequest, setBloodRequest] = useState<BloodRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBloodRequest = async () => {
      try {
        const response = await fetch(`/api/blood/requests/${id}`)
        if (!response.ok) throw new Error('Failed to fetch blood request')
        const data = await response.json()
        setBloodRequest(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchBloodRequest()
  }, [id])

  if (loading) return <div className="container mx-auto p-4">Loading...</div>
  if (error) return <div className="container mx-auto p-4 text-red-600">Error: {error}</div>
  if (!bloodRequest) return <div className="container mx-auto p-4">Blood request not found</div>

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => navigate('/blood-requests')}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back to Requests
      </button>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            {bloodRequest.bloodGroup} Blood Needed
          </h1>
          <p className="text-gray-600">{bloodRequest.hospitalName} · {bloodRequest.hospitalAddress}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Request Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600">Blood Group</p>
                <p className="text-xl font-semibold">{bloodRequest.bloodGroup}</p>
              </div>
              <div>
                <p className="text-gray-600">Units Needed</p>
                <p className="text-xl font-semibold">{bloodRequest.unitsNeeded}</p>
              </div>
              <div>
                <p className="text-gray-600">Emergency Level</p>
                <p className={`text-xl font-semibold ${bloodRequest.emergencyLevel === 'urgent' ? 'text-red-600' : 'text-orange-600'}`}>
                  {emergencyLabel(bloodRequest.emergencyLevel)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Required Date</p>
                <p className="text-sm">{new Date(bloodRequest.requiredDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Location</p>
                <p className="text-sm">{bloodRequest.location}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Requester Information</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-semibold text-lg mb-2">{bloodRequest.requester.name}</p>
              <p className="text-gray-600 mb-2">Phone: {bloodRequest.requester.phone}</p>
              <button
                onClick={() => navigate('/messenger', { state: { contactChatId: bloodRequest.requester.id } })}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
              >
                Contact Donor
              </button>
            </div>
          </div>
        </div>

        {bloodRequest.additionalNotes && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Additional Notes</h2>
            <p className="text-gray-700 leading-relaxed">{bloodRequest.additionalNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
