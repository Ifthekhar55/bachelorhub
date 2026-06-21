import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />
}

export default PrivateRoute