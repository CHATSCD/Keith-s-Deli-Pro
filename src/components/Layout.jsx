import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <span className="text-lg font-bold text-indigo-700 tracking-tight">Bindery Pro</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
