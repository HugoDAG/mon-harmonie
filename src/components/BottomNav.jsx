import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Accueil', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/accueil%20trans.png' },
  { path: '/calendar', label: 'Calendrier', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/calendrier%20trans.png' },
  { path: 'fab', label: '' },
  { path: '/directory', label: 'Annuaire', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/annuaire%20trans.png' },
  { path: '/profile', label: 'Mon compte', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/Mon%20compte%20trans.png' }
]

export default function BottomNav({ onPlusClick }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, label, img }) => {
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
        const isActive = location.pathname === path
        return (
          <button
            key={path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <img src={img} alt={label} style={{ width: 40, height: 40, objectFit: 'contain', opacity: isActive ? 1 : 0.5, marginBottom: -4 }} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
