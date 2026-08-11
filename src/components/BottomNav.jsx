import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

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
  const { profile } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'syndic'

  useEffect(() => {
    if (isAdmin) {
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'pending')
        .then(({ count }) => setPendingCount(count || 0))
    }
  }, [isAdmin, location.pathname])

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
        const showBadge = path === '/profile' && isAdmin && pendingCount > 0
        return (
          <button
            key={path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(path)}
            style={{ position: 'relative' }}
          >
            <img src={img} alt={label} style={{ width: 50, height: 50, objectFit: 'contain', opacity: isActive ? 1 : 0.5, marginBottom: -6 }} />
            {label}
            {showBadge && (
              <div style={{
                position: 'absolute', top: 2, right: 4,
                width: 18, height: 18, borderRadius: '50%',
                background: 'var(--red-500)', color: '#fff',
                fontSize: 10, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--green-dark)'
              }}>
                {pendingCount}
              </div>
            )}
          </button>
        )
      })}
    </nav>
  )
}
