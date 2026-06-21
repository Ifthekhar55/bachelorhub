import { useState } from 'react'
import { Download, Eye } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

const Payments = () => {
  const [payments] = useState([
    { id: 'TRX001', user: 'Md. Rahman', amount: 500, type: 'Boost', status: 'completed', date: '2024-01-20' },
    { id: 'TRX002', user: 'Sadia Akter', amount: 2000, type: 'Premium Plan', status: 'completed', date: '2024-01-19' },
    { id: 'TRX003', user: 'Rafiqul Islam', amount: 500, type: 'Boost', status: 'pending', date: '2024-01-18' },
  ])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Transactions</h1>
          <p className="text-gray-500 mt-1">Monitor all financial transactions</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Transaction ID</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">User</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Amount</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{payment.id}</td>
                <td className="px-6 py-4">{payment.user}</td>
                <td className="px-6 py-4">৳{payment.amount}</td>
                <td className="px-6 py-4">{payment.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{payment.date}</td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default Payments