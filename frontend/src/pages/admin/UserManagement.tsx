import { useState } from 'react'
import { Search, MoreVertical, Shield, UserX, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const users = [
    { id: 1, name: 'Md. Rahman', email: 'rahman@example.com', role: 'landlord', status: 'verified', joined: '2024-01-15' },
    { id: 2, name: 'Sadia Akter', email: 'sadia@example.com', role: 'tenant', status: 'pending', joined: '2024-01-20' },
    { id: 3, name: 'Rafiqul Islam', email: 'rafiq@example.com', role: 'landlord', status: 'verified', joined: '2024-01-10' },
    { id: 4, name: 'Fatema Begum', email: 'fatema@example.com', role: 'tenant', status: 'suspended', joined: '2024-01-05' },
  ]

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'verified':
        return <span className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs"><CheckCircle className="w-3 h-3" /> Verified</span>
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs"><Clock className="w-3 h-3" /> Pending</span>
      case 'suspended':
        return <span className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs"><XCircle className="w-3 h-3" /> Suspended</span>
      default:
        return <span>{status}</span>
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500 mt-1">Manage all platform users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="px-6 py-3 text-sm font-medium text-gray-500">User</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Role</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Joined</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.role !== 'tenant' ? (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'landlord' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {user.role}
                    </span>
                  ) : null}
                </td>
                <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Shield className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                      <UserX className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default UserManagement