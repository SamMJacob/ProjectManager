import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from './NotificationBell'
import { toast } from 'sonner'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <Link to="/projects" className="font-bold text-blue-600 text-lg">FlowBoard</Link>
        <Link to="/projects"  className="text-sm text-gray-600 hover:text-gray-900">Projects</Link>
        <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <span className="text-sm text-gray-500">{user?.username}</span>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">
          Logout
        </button>
      </div>
    </nav>
  )
}
