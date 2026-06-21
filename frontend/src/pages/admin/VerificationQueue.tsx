import { useState } from 'react'
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

const VerificationQueue = () => {
  const [verifications] = useState([
    { id: 1, name: 'Md. Rahman', type: 'NID', submitted: '2024-01-20', status: 'pending' },
    { id: 2, name: 'Sadia Akter', type: 'NID', submitted: '2024-01-19', status: 'pending' },
    { id: 3, name: 'Rafiqul Islam', type: 'Student ID', submitted: '2024-01-18', status: 'pending' },
    { id: 4, name: 'Fatema Begum', type: 'NID', submitted: '2024-01-17', status: 'pending' },
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Verification Queue</h1>
        <p className="text-gray-500 mt-1">Review and verify user documents</p>
      </div>

      <div className="grid gap-4">
        {verifications.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <span className="text-sm text-gray-500">{item.type}</span>
                  <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                </div>
                <p className="text-sm text-gray-500">Submitted: {item.submitted}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Documents
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

export default VerificationQueue