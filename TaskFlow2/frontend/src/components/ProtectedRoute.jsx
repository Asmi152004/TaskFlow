import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'
import Spinner from './Spinner'

// Only logged-in users can see the pages inside this route
export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner label="Checking your session..." />
  if (!user) return <Navigate to="/login" replace />

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}
