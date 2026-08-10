import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Calendar, Users, User, Plus } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/calendar', icon: Calendar, label: 'Calendrier' },
  { path: 'fab', icon: Plus, label: '' },
  { path: '/directory', icon: Users, label: 'Annuaire' },
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
            <button key="fab" onClick={onPlusClick} style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--terracotta)', color: '#fff',
              border: '3px solid var(--white)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -24, boxShadow: '0 4px 12px rgba(196,121,78,0.3)',
              cursor: 'pointer'
            }}>
              <Plus size={24} />
            </button>
          )
        }
        return (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={22} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
