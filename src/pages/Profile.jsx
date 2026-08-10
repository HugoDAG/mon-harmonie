import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { LogOut, Building, Mail, LinkIcon, Users, Book, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [coResidentName, setCoResidentName] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

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

    // Supprimer le lien co-résident
    if (profile?.co_resident_id) {
      await supabase.from('profiles').update({ co_resident_id: null }).eq('id', profile.co_resident_id)
    }

    // Supprimer les données
    await supabase.from('comments').delete().eq('user_id', user.id)
    await supabase.from('post_likes').delete().eq('user_id', user.id)
    await supabase.from('posts').delete().eq('user_id', user.id)
    await supabase.from('bookings').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <div className="page-content">
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Mon profil</h1>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="avatar" style={{
            width: 64, height: 64, fontSize: 22, margin: '0 auto 12px',
            background: 'var(--blue-50)', color: 'var(--blue-600)'
          }}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {profile?.first_name} {profile?.last_name}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <Building size={18} color="var(--gray-400)" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Bâtiment</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{profile?.building}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <Mail size={18} color="var(--gray-400)" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Email</div>
              <div style={{ fontSize: 14 }}>{profile?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <LinkIcon size={18} color="var(--gray-400)" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Co-résident</div>
              {coResidentName ? (
                <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="var(--green-500)" />
                  {coResidentName}
                  <span style={{ fontSize: 11, color: 'var(--green-500)', background: 'var(--green-50)', padding: '2px 8px', borderRadius: 99 }}>Lié</span>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Aucun co-résident lié</div>
              )}
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/rules')} className="card" style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', cursor: 'pointer',
          textAlign: 'left', border: '1px solid var(--gray-200)', background: '#fff', marginTop: 4
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Book size={18} color="var(--blue-500)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Règles de la copropriété</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Horaires, déchets, parking…</div>
          </div>
          <ChevronRight size={18} color="var(--gray-300)" />
        </button>

        <button
          onClick={signOut}
          className="btn"
          style={{
            width: '100%', marginTop: 24, padding: 12,
            background: 'var(--red-50)', color: 'var(--red-500)',
            border: '1px solid var(--red-500)', borderRadius: 'var(--radius)'
          }}
        >
          <LogOut size={16} /> Se déconnecter
        </button>

        {/* Suppression de compte */}
        <div style={{ marginTop: 32, borderTop: '1px solid var(--gray-200)', paddingTop: 20 }}>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'center' }}>
              Supprimer mon compte
            </button>
          ) : (
            <div style={{ background: 'var(--red-50)', padding: 16, borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={18} color="var(--red-500)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--red-500)' }}>Supprimer mon compte</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 12, lineHeight: 1.5 }}>
                Cette action est irréversible. Toutes vos publications, commentaires et données seront supprimées. Tapez SUPPRIMER pour confirmer.
              </p>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <input
                  value={deleteText}
                  onChange={e => setDeleteText(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  style={{ borderColor: 'var(--red-500)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteText('') }} className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}>
                  Annuler
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteText !== 'SUPPRIMER' || deleting}
                  className="btn" style={{
                    flex: 1, fontSize: 13, background: deleteText === 'SUPPRIMER' ? 'var(--red-500)' : 'var(--gray-300)',
                    color: '#fff', border: 'none', borderRadius: 'var(--radius)'
                  }}>
                  {deleting ? 'Suppression…' : 'Confirmer'}
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
