import { useState } from 'react'
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

const ListingModeration = () => {
  const [listings] = useState([
    { id: 1, title: 'Cozy Single Room', landlord: 'Md. Rahman', reported: false, status: 'pending' },
    { id: 2, title: 'Suspicious Deal', landlord: 'Unknown User', reported: true, reason: 'Scam pattern', status: 'flagged' },
    { id: 3, title: 'Deluxe Apartment', landlord: 'Sadia Akter', reported: false, status: 'pending' },
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Listing Moderation</h1>
        <p className="text-gray-500 mt-1">Review and moderate property listings</p>
      </div>

      <div className="grid gap-4">
        {listings.map((listing) => (
          <Card key={listing.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="font-semibold text-lg">{listing.title}</h3>
                  {listing.reported && (
                    <span className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">
                      <AlertTriangle className="w-3 h-3" /> Flagged: {listing.reason}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Landlord: {listing.landlord}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ListingModeration