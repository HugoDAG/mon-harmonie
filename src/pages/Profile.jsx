import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import ChangePassword from '../components/ChangePassword'
import { LogOut, Building, Mail, LinkIcon, Users, Book, ChevronRight, AlertTriangle, HelpCircle, FileText, Bell, CalendarCheck, User, Settings } from 'lucide-react'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [coResidentName, setCoResidentName] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  useEffect(() => {
    if (profile?.co_resident_id) {
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', profile.co_resident_id)
        .single()
        .then(({ data }) => {
          if (data) setCoResidentName(`${data.first_name} ${data.last_name?.[0] || ''}.`)
        })
    }
  }, [profile])

  async function handleDeleteAccount() {
    if (deleteText !== 'SUPPRIMER') return
    setDeleting(true)
    if (profile?.co_resident_id) {
      await supabase.from('profiles').update({ co_resident_id: null }).eq('id', profile.co_resident_id)
    }
    await supabase.from('comments').delete().eq('user_id', user.id)
    await supabase.from('post_likes').delete().eq('user_id', user.id)
    await supabase.from('posts').delete().eq('user_id', user.id)
    await supabase.from('bookings').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    await signOut()
    navigate('/login')
  }

  const menuItems = [
    { icon: User, label: 'Mes informations', subtitle: `${profile?.first_name} ${profile?.last_name} · Bât. ${profile?.building}`, action: null },
    { icon: LinkIcon, label: 'Co-résident', subtitle: coResidentName ? `Lié avec ${coResidentName}` : 'Aucun co-résident lié', action: null, badge: coResidentName ? 'Lié' : null },
    { icon: AlertTriangle, label: 'Mes signalements', subtitle: 'Voir mes signalements envoyés', action: () => navigate('/posts/signalement?tab=mine') },
    { icon: CalendarCheck, label: 'Mes réservations', subtitle: 'Espaces communs réservés', action: () => navigate('/bookings') },
    { icon: FileText, label: 'Mes documents', subtitle: 'Documents de la copropriété', action: () => navigate('/documents') },
    { icon: Bell, label: 'Mes notifications', subtitle: 'Préférences de notification', action: null },
    { icon: Book, label: 'Règles de la copropriété', subtitle: 'Horaires, déchets, parking...', action: () => navigate('/rules') },
    { icon: HelpCircle, label: "Guide d'utilisation", subtitle: 'Comment utiliser Mon Harmonie', action: () => navigate('/guide') },
    { icon: Settings, label: 'Paramètres', subtitle: 'Mot de passe, confidentialité', action: () => setShowPasswordChange(s => !s) }
  ]

  return (
    <div className="app-shell">
      <div className="page-content">
        <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 20 }}>Mon compte</h1>

        {/* Profile header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px', borderRadius: 'var(--radius-lg)',
          background: 'var(--green-dark)', marginBottom: 20
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', color: 'var(--cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 600
          }}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>
              {profile?.first_name} {profile?.last_name?.[0]}.
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Bâtiment {profile?.building} · Résidence Harmonie
            </div>
            {coResidentName && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                Avec {coResidentName}
              </div>
            )}
          </div>
        </div>

        {/* Menu items */}
        <div style={{ marginBottom: 16 }}>
          {menuItems.map((item, i) => {
            const ItemIcon = item.icon
            return (
              <button key={i} onClick={item.action || undefined} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '14px 16px', background: 'var(--white)',
                border: 'none', borderBottom: '1px solid var(--border-light)',
                cursor: item.action ? 'pointer' : 'default', textAlign: 'left'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--cream)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <ItemIcon size={18} color="var(--green-sage)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.subtitle}</div>
                </div>
                {item.badge && (
                  <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--green-500)', background: 'var(--green-50)', padding: '2px 8px', borderRadius: 99 }}>{item.badge}</span>
                )}
                {item.action && <ChevronRight size={16} color="var(--text-muted)" />}
              </button>
            )
          })}
        </div>

        {/* Password change */}
        {showPasswordChange && (
          <div style={{ marginBottom: 16 }}>
            <ChangePassword />
          </div>
        )}

        {/* Logout */}
        <button onClick={signOut} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: 14, borderRadius: 'var(--radius)',
          background: 'var(--white)', border: '1px solid var(--terracotta)',
          color: 'var(--terracotta)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          marginBottom: 16
        }}>
          <LogOut size={16} /> Déconnexion
        </button>

        {/* Delete account */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'center' }}>
              Supprimer mon compte
            </button>
          ) : (
            <div style={{ background: 'var(--red-50)', padding: 16, borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={18} color="var(--red-500)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--red-500)' }}>Supprimer mon compte</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-medium)', marginBottom: 12, lineHeight: 1.5 }}>
                Cette action est irréversible. Toutes vos publications, commentaires et données seront supprimées. Tapez SUPPRIMER pour confirmer.
              </p>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="Tapez SUPPRIMER" style={{ borderColor: 'var(--red-500)' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteText('') }} className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
                <button onClick={handleDeleteAccount} disabled={deleteText !== 'SUPPRIMER' || deleting}
                  className="btn" style={{
                    flex: 1, fontSize: 13,
                    background: deleteText === 'SUPPRIMER' ? 'var(--red-500)' : 'var(--gray-300)',
                    color: '#fff', border: 'none', borderRadius: 'var(--radius)'
                  }}>
                  {deleting ? 'Suppression...' : 'Confirmer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
