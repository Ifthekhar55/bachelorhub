import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Shield, Home, Flag, 
  CreditCard, TrendingUp, MessageSquare, Bell, Settings,
  CheckCircle, XCircle, Clock, Eye
} from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import UserManagement from './UserManagement'
import VerificationQueue from './VerificationQueue'
import ListingModeration from './ListingModeration'
import Reports from './Reports'
import Payments from './Payments'

const AdminDashboard = () => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('dashboard')

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: Users, path: '/admin/users' },
    { id: 'verify', label: 'Verification Queue', icon: Shield, path: '/admin/verify' },
    { id: 'listings', label: 'Listing Moderation', icon: Home, path: '/admin/listings' },
    { id: 'reports', label: 'Reports', icon: Flag, path: '/admin/reports' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/admin/notifications' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ]

  const stats = [
    { label: 'Total Users', value: '1,234', icon: Users, change: '+12%', color: 'text-blue-600' },
    { label: 'Pending Verifications', value: '45', icon: Shield, change: '+3', color: 'text-yellow-600' },
    { label: 'Active Listings', value: '567', icon: Home, change: '+8%', color: 'text-green-600' },
    { label: 'Today\'s Revenue', value: '৳45,200', icon: CreditCard, change: '+15%', color: 'text-purple-600' },
  ]

  if (location.pathname !== '/admin/dashboard' && activeTab === 'dashboard') {
    const tab = menuItems.find(item => item.path === location.pathname)
    if (tab) setActiveTab(tab.id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-screen sticky top-[10px]">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
          <nav className="p-4">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route index element={
              <div>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                  <p className="text-gray-500 mt-1">Welcome back, Admin</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat, index) => (
                    <Card key={index} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm">{stat.label}</p>
                          <p className="text-2xl font-bold mt-1">{stat.value}</p>
                          <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
                        </div>
                        <div className={`bg-${stat.color.split('-')[1]}-100 p-3 rounded-full`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Verifications</h2>
                    <div className="space-y-3">
                      {[
                        { name: 'Md. Rahman', type: 'NID', status: 'pending', time: '5 min ago' },
                        { name: 'Sadia Akter', type: 'NID', status: 'approved', time: '1 hour ago' },
                        { name: 'Rafiqul Islam', type: 'Student ID', status: 'pending', time: '2 hours ago' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.type} • {item.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.status === 'pending' ? (
                              <span className="flex items-center gap-1 text-yellow-600 text-sm">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="w-3 h-3" /> Approved
                              </span>
                            )}
                            <Button size="sm" variant="ghost">Review</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Flagged Listings</h2>
                    <div className="space-y-3">
                      {[
                        { title: 'Suspicious Post', reporter: 'user123', reason: 'Scam', time: '10 min ago' },
                        { title: 'Duplicate Listing', reporter: 'tenant456', reason: 'Duplicate', time: '30 min ago' },
                        { title: 'Wrong Location', reporter: 'finder789', reason: 'Misleading', time: '1 hour ago' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-gray-500">Reported by {item.reporter} • {item.reason}</p>
                          </div>
                          <Button size="sm" variant="outline">Review</Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            } />
            <Route path="users" element={<UserManagement />} />
            <Route path="verify" element={<VerificationQueue />} />
            <Route path="listings" element={<ListingModeration />} />
            <Route path="reports" element={<Reports />} />
            <Route path="payments" element={<Payments />} />
            <Route path="notifications" element={<div className="text-center py-12">Notifications Management Coming Soon</div>} />
            <Route path="settings" element={<div className="text-center py-12">Settings Coming Soon</div>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard