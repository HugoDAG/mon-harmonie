import { useLocation, useNavigate } from 'react-router-dom'
import { Home, MessageCircle, Calendar, Users, User } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/calendar', icon: Calendar, label: 'Calendrier' },
  { path: '/directory', icon: Users, label: 'Annuaire' },
  { path: '/profile', icon: User, label: 'Profil' }
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
        <button
          key={path}
          className={`nav-item ${location.pathname === path ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <Icon size={22} />
          {label}
        </button>
      ))}
    </nav>
  )
}
