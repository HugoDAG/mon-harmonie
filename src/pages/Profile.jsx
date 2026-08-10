import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import ChangePassword from '../components/ChangePassword'
import { LogOut, User, AlertTriangle, Megaphone, FileText, Book, HelpCircle, ChevronDown, LinkIcon, Building, Mail, Lock } from 'lucide-react'

const STATUS_LABELS = {
  open: '🆕 Nouveau',
  in_progress: '⏳ En cours',
  resolved: '✅ Résolu',
  rejected: '❌ Rejeté'
}

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [coResidentName, setCoResidentName] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [openSection, setOpenSection] = useState(null)
  const [mySignalements, setMySignalements] = useState([])
  const [myAnnonces, setMyAnnonces] = useState([])
  const [loadingSignalements, setLoadingSignalements] = useState(false)
  const [loadingAnnonces, setLoadingAnnonces] = useState(false)

  useEffect(() => {
    if (profile?.co_resident_id) {
      supabase.from('profiles').select('first_name, last_name').eq('id', profile.co_resident_id).single()
        .then(({ data }) => { if (data) setCoResidentName(`${data.first_name} ${data.last_name?.[0] || ''}.`) })
    }
  }, [profile])

  function toggleSection(section) {
    if (openSection === section) {
      setOpenSection(null)
    } else {
      setOpenSection(section)
      if (section === 'signalements' && mySignalements.length === 0) fetchMySignalements()
      if (section === 'annonces' && myAnnonces.length === 0) fetchMyAnnonces()
    }
  }

  async function fetchMySignalements() {
    setLoadingSignalements(true)
    const { data } = await supabase.from('posts').select('*').eq('user_id', user.id).eq('type', 'signalement').order('created_at', { ascending: false })
    setMySignalements(data || [])
    setLoadingSignalements(false)
  }

  async function fetchMyAnnonces() {
    setLoadingAnnonces(true)
    const { data } = await supabase.from('posts').select('*').eq('user_id', user.id).eq('type', 'annonce').order('created_at', { ascending: false })
    setMyAnnonces(data || [])
    setLoadingAnnonces(false)
  }

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

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const sections = [
    { key: 'infos', label: 'Mes informations', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/mes%20informations%20trans.png' },
   { key: 'signalements', label: 'Mes signalements', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/mes%20signalements%20trans.png' },
    { key: 'annonces', label: 'Mes annonces', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/mes%20annonces%20trans.png' },
    { key: 'regles', label: 'Règles de la copropriété', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/regle%20de%20coprop%20trans.png', action: () => navigate('/rules') },
    { key: 'guide', label: "Guide d'utilisation", img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/guide%20utilisation%20app%20trans.png', action: () => navigate('/guide') }
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

        {/* Menu sections */}
        <div style={{ marginBottom: 16 }}>
          {sections.map(({ key, label, action, img }) => {
            const isOpen = openSection === key
            const isLink = !!action
            return (
              <div key={key} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <button onClick={() => isLink ? action() : toggleSection(key)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '14px 16px', background: 'var(--white)',
                  border: 'none', cursor: 'pointer', textAlign: 'left'
                }}>
                  <img src={img} alt={label} style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>{label}</div>
                  </div>
                  {isLink ? (
                    <ChevronDown size={16} color="var(--text-muted)" style={{ transform: 'rotate(-90deg)' }} />
                  ) : (
                    <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  )}
                </button>

                {/* Mes informations */}
                {key === 'infos' && isOpen && (
                  <div style={{ padding: '0 16px 16px', background: 'var(--white)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <User size={16} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nom</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{profile?.first_name} {profile?.last_name}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <Building size={16} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bâtiment</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{profile?.building}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <Mail size={16} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email</div>
                        <div style={{ fontSize: 14 }}>{profile?.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <LinkIcon size={16} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Co-résident</div>
                        {coResidentName ? (
                          <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {coResidentName}
                            <span style={{ fontSize: 10, color: 'var(--green-500)', background: 'var(--green-50)', padding: '2px 8px', borderRadius: 99 }}>Lié</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun co-résident lié</div>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <ChangePassword />
                    </div>
                  </div>
                )}

                {/* Mes signalements */}
                {key === 'signalements' && isOpen && (
                  <div style={{ padding: '0 16px 16px', background: 'var(--white)' }}>
                    {loadingSignalements ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Chargement...</p>
                    ) : mySignalements.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Aucun signalement envoyé</p>
                    ) : (
                      mySignalements.map(s => (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                          borderBottom: '1px solid var(--border-light)'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)' }}>
                              {s.content.length > 60 ? s.content.slice(0, 60) + '...' : s.content}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {formatDate(s.created_at)}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                            {STATUS_LABELS[s.status || 'open']}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Mes annonces */}
                {key === 'annonces' && isOpen && (
                  <div style={{ padding: '0 16px 16px', background: 'var(--white)' }}>
                    {loadingAnnonces ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Chargement...</p>
                    ) : myAnnonces.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Aucune annonce publiée</p>
                    ) : (
                      myAnnonces.map(a => (
                        <div key={a.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                          borderBottom: '1px solid var(--border-light)'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)' }}>
                              {a.content.length > 60 ? a.content.slice(0, 60) + '...' : a.content}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {formatDate(a.created_at)} · {a.channel === 'building' ? `Bât. ${a.building}` : 'Résidence'}
                            </div>
                          </div>
                          {a.image_url && (
                            <img src={a.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

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
