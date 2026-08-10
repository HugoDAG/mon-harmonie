import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Users2, CalendarCheck, Megaphone, User, Plus } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/posts/voisinage', icon: Users2, label: 'Voisinage' },
  { path: 'fab', icon: Plus, label: '' },
  { path: '/posts/annonce', icon: Megaphone, label: 'Annonces' },
  { path: '/profile', icon: User, label: 'Mon compte' }
]

export default function BottomNav({ onPlusClick }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
        if (path === 'fab') {
          return (
            <button key="fab" onClick={onPlusClick || (() => navigate('/bookings'))} style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--green-dark)', color: 'var(--cream)',
              border: '3px solid var(--white)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -26, boxShadow: '0 4px 12px rgba(74,91,58,0.3)',
              cursor: 'pointer'
            }}>
              <Plus size={24} />
            </button>
          )
        }
        const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
        return (
          <button
            key={path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={20} />
            <span style={{ fontSize: 9 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
