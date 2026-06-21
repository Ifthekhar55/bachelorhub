import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const AdminRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }
  
  return isAuthenticated && user?.role === 'admin' ? <Outlet /> : <Navigate to="/" />
}

export default AdminRoute