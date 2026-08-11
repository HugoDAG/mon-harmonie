import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import ChangePassword from '../components/ChangePassword'
import { LogOut, User, AlertTriangle, Megaphone, FileText, Book, HelpCircle, ChevronDown, LinkIcon, Building, Mail, Lock, Home } from 'lucide-react'

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
  const [editingApartment, setEditingApartment] = useState(false)
  const [aptValue, setAptValue] = useState('')
  const [showAptInfo, setShowAptInfo] = useState(false)
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

async function saveApartment() {
    const apt = aptValue.trim().toUpperCase()
    if (!apt) return

    const buildingMatch = apt.match(/^([A-Z]+\d)/)
    const building = buildingMatch ? buildingMatch[1] : profile?.building

    await supabase.from('profiles').update({ apartment: apt, building }).eq('id', user.id)

    if (building) {
      const { data: existing } = await supabase.from('apartments')
        .select('id').eq('building', building).eq('number', apt)

      if (!existing || existing.length === 0) {
        const { error } = await supabase.from('apartments').insert({ building, number: apt })
        if (error) console.error('Erreur creation appartement:', error)
      }
    }

    setEditingApartment(false)
    window.location.reload()
  }
  function toggleSection(section) {
    if (openSection === section) {
      setOpenSection(null)
    } else {
      setOpenSection(section)
      setTimeout(() => {
        document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
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
    { key: 'infos', label: 'Mes informations', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/mes%20informations%20trans%202.png' },
    { key: 'signalements', label: 'Mes signalements', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/mes%20signalements%20trans%202.png' },
    { key: 'annonces', label: 'Mes annonces', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/mes%20annonces%20trans%202.png' },
    { key: 'regles', label: 'Regles de la copropriete', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/regle%20de%20coprop%20trans.png', action: () => navigate('/rules') },
    { key: 'guide', label: "Guide d'utilisation", img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/guide%20utilisation%20trans%202.png', action: () => navigate('/guide') },
    ...(profile?.role === 'admin' || profile?.role === 'syndic' ? [
      { key: 'residence', label: 'Ma residence', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/ma%20residence.png', action: () => navigate('/ma-residence') },
      { key: 'pending', label: 'Demandes en attente', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/demandes%20en%20attente%20trans%202.png', action: () => navigate('/pending') }
    ] : [])
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
              Batiment {profile?.building} - Residence Harmonie
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
              <div key={key} id={`section-${key}`} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <button onClick={() => isLink ? action() : toggleSection(key)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '14px 16px', background: 'var(--white)',
                  border: 'none', cursor: 'pointer', textAlign: 'left'
                }}>
                  <div style={{ width: 68, height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={img} alt={label} style={{ width: key === 'annonces' ? 56 : 68, height: key === 'annonces' ? 56 : 68, objectFit: 'contain' }} />
                  </div>
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
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Batiment</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{profile?.building}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <Home size={16} color="var(--text-muted)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Appartement</div>
                        {editingApartment ? (
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <input value={aptValue} onChange={e => setAptValue(e.target.value)} placeholder="Ex: C999"
                              style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
                            <button onClick={saveApartment} style={{ background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>OK</button>
                            <button onClick={() => setEditingApartment(false)} style={{ background: 'var(--cream)', border: 'none', borderRadius: 'var(--radius)', padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>x</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{profile?.apartment || 'Non renseigne'}</span>
                            <button onClick={() => { setAptValue(profile?.apartment || ''); setEditingApartment(true) }} style={{ background: 'none', border: 'none', color: 'var(--green-sage)', fontSize: 12, cursor: 'pointer' }}>Modifier</button>
                            <button onClick={() => setShowAptInfo(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginLeft: 'auto' }}>i</button>
                          </div>
                        )}
                        {showAptInfo && (
                          <div style={{
                            marginTop: 6, padding: '10px 12px',
                            background: 'var(--cream)', borderRadius: 'var(--radius)',
                            fontSize: 12, color: 'var(--text-medium)', lineHeight: 1.6
                          }}>
                            <p>Votre n d'appartement reste <strong>anonyme</strong>. Seul votre batiment ({profile?.building}) est visible par les autres residents.</p>
                            <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>Ce numero permet de verifier votre appartenance a la residence.</p>
                          </div>
                        )}
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
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Co-resident</div>
                        {coResidentName ? (
                          <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {coResidentName}
                            <span style={{ fontSize: 10, color: 'var(--green-500)', background: 'var(--green-50)', padding: '2px 8px', borderRadius: 99 }}>Lie</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun co-resident lie</div>
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
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Aucun signalement envoye</p>
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
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Aucune annonce publiee</p>
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
                              {formatDate(a.created_at)} - {a.channel === 'building' ? 'Bat. ' + a.building : 'Residence'}
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
          <LogOut size={16} /> Deconnexion
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
                Cette action est irreversible. Toutes vos publications, commentaires et donnees seront supprimees. Tapez SUPPRIMER pour confirmer.
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
