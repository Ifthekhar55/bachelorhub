import { useState } from 'react'
import { Flag, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

const Reports = () => {
  const [reports] = useState([
    { id: 1, type: 'listing', target: 'Cozy Room', reporter: 'user123', reason: 'Scam', status: 'pending', date: '2024-01-20' },
    { id: 2, type: 'user', target: 'Md. Rahman', reporter: 'user456', reason: 'Harassment', status: 'pending', date: '2024-01-19' },
    { id: 3, type: 'listing', target: 'Deluxe Flat', reporter: 'user789', reason: 'Misleading info', status: 'pending', date: '2024-01-18' },
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports & Flags</h1>
        <p className="text-gray-500 mt-1">Review user reports and take action</p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold">Report on {report.type}: {report.target}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">Reported by: {report.reporter}</p>
                <p className="text-sm text-gray-600 mb-1">Reason: {report.reason}</p>
                <p className="text-xs text-gray-500">Date: {report.date}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Review
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Dismiss
                </Button>
                <Button variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Take Action
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Reports