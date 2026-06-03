import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
