import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

// Login and register pages: logged-in users are sent to the dashboard instead
export default function PublicOnly({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner label="Checking your session..." />
  if (user) return <Navigate to="/" replace />

  return children
}
