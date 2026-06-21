// src/App.tsx
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useSocket } from './contexts/SocketContext'  // ✅ ADD THIS line (import)
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import HomePage from './pages/HomePage'
import Feed from './pages/feed/Feed'
import BloodRequests from './pages/blood/BloodRequests'
import CreateBloodRequest from './pages/blood/CreateBloodRequest'
import BloodRequestDetail from './pages/blood/BloodRequestDetail'
import DonorProfile from './pages/blood/DonorProfile'
import ListingDetail from './pages/listings/ListingDetails'
import CreateListing from './pages/listings/CreateListing'
import EditListing from './pages/listings/EditListing'
import Messenger from './pages/chat/Messenger'
import RoommateFinder from './pages/roommate/RoommateFinder'
import Bookings from './pages/roommate/Bookings'
import Profile from './pages/profile/Profile'
import Dashboard from './pages/dashboard/Dashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyOTP from './pages/auth/VerifyOTP'
import ForgotPassword from './pages/auth/ForgotPassword'
import Community from './pages/community/Community'
import UsedItems from './pages/used-items/UsedItems';
import UsedItemDetail from './pages/used-items/UsedItemDetails'
import PostUsedItem from './pages/used-items/PostUsedItem'
import EditUsedItem from './pages/used-items/EditUsedItem'
import MyListings from './pages/used-items/MyListings'
import SavedItems from './pages/used-items/SavedItems'
import Settings from './pages/profile/Settings'
import Terms from './pages/static/Terms'
import Privacy from './pages/static/Privacy'
import Help from './pages/Help'
import NotFound from './pages/static/NotFound'
import PrivateRoute from './routes/PrivateRoute'
import AdminRoute from './routes/adminRoute'

function App() {
  const { checkAuth } = useAuthStore()
  const socket = useSocket()  // ✅ ADD THIS LINE (get socket instance)

  // ✅ ADD THIS useEffect FOR TESTING SOCKET
  useEffect(() => {
    if (!socket) {
      console.log('⏳ Waiting for socket connection...')
      return
    }

    const handleConnect = () => {
      console.log('✅ Socket connected!')
      console.log('Socket ID:', socket.id)
    }

    if (socket.connected) {
      handleConnect()
    } else {
      socket.on('connect', handleConnect)
    }

    return () => {
      socket.off('connect', handleConnect)
    }
  }, [socket])

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/community" element={<Community />} />
          <Route path="/used-items" element={<UsedItems />} />
          <Route path="/used-item/:id" element={<UsedItemDetail />} />
          <Route path="/post-used-item" element={<PostUsedItem />} />
          <Route path="/edit-used-item/:id" element={<EditUsedItem />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/saved-items" element={<SavedItems />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help" element={<Help />} />
          <Route path="/blood-requests" element={<BloodRequests />} />
          <Route path="/blood-request/:id" element={<BloodRequestDetail />} />
          <Route path="/create-blood-request" element={<CreateBloodRequest />} />
          <Route path="/donor-profile" element={<DonorProfile />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/edit-listing/:id" element={<EditListing />} />
            <Route path="/messenger" element={<Messenger />} />
            <Route path="/homechef" element={<RoommateFinder />} />
            <Route path="/homechef/bookings" element={<Bookings />} />
            <Route path="/profile/update" element={<Profile forceEdit={true} />} />
            <Route path="/profile/:id?" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          
          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App