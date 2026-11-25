import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import ChangePassword from '../components/ChangePassword'
import ReglagesNotifications from '../components/ReglagesNotifications'
import { LogOut, User, AlertTriangle, ChevronDown, LinkIcon, Building, Mail, Home } from 'lucide-react'

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

  useEffect(() => {
    if (profile?.co_resident_id) {
      supabase.from('profiles').select('first_name, last_name').eq('id', profile.co_resident_id).single()
        .then(({ data }) => { if (data) setCoResidentName(`${data.first_name} ${data.last_name?.[0] || ''}.`) })
    }
  }, [profile])

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar-${user.id}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('documents').upload(`avatars/${fileName}`, file, { upsert: true })
    if (uploadError) {
      alert("La photo n'a pas pu être envoyée : " + uploadError.message)
      return
    }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`avatars/${fileName}`)
    const { error } = await supabase.from('profiles')
      .update({ avatar_url: urlData.publicUrl }).eq('id', user.id)
    if (error) {
      alert("La photo a été envoyée mais n'a pas pu être enregistrée : " + error.message)
      return
    }
    window.location.reload()
  }
  async function saveApartment() {
    const apt = aptValue.trim().toUpperCase()
    if (!apt) return

    const buildingMatch = apt.match(/^([A-Z]+\d)/)
    const building = buildingMatch ? buildingMatch[1] : profile?.building

    const { error } = await supabase.from('profiles')
      .update({ apartment: apt, building }).eq('id', user.id)
    if (error) {
      alert("Le numéro d'appartement n'a pas pu être enregistré : " + error.message)
      return
    }

    if (building) {
      // Crée le logement dans « Ma résidence » s'il n'y figure pas encore
      const { error: aptError } = await supabase.rpc('create_apartment_if_not_exists', {
        p_building: building,
        p_number: apt
      })
      if (aptError) {
        alert("Votre appartement est enregistré, mais il n'a pas pu être ajouté à « Ma résidence » : "
          + aptError.message)
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
    }
  }

  async function handleDeleteAccount() {
    if (deleteText !== 'SUPPRIMER') return
    setDeleting(true)

    // 1. Les fichiers déposés dans le stockage : la base ne peut pas
    //    les effacer elle-même, et il faut le faire tant que la
    //    session est encore valide.
    const { data: docs } = await supabase
      .from('personal_documents').select('file_url').eq('user_id', user.id)
    const paths = (docs || [])
      .map(d => d.file_url)
      .filter(p => p && !p.startsWith('http'))
    if (paths.length > 0) {
      await supabase.storage.from('personal').remove(paths)
    }
    if (profile?.avatar_url) {
      const name = profile.avatar_url.split('/').pop()
      if (name) await supabase.storage.from('documents').remove([`avatars/${name}`])
    }

    // 2. Tout le reste en une seule opération côté base : contenu
    //    personnel, liens de co-résidence, puis le compte lui-même,
    //    ce qui libère l'adresse email pour une réinscription.
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      setDeleting(false)
      alert(
        "Votre compte n'a pas pu être supprimé : " + error.message +
        "\n\nVos documents personnels ont en revanche bien été effacés." +
        "\nSignalez ce message à l'administrateur de la résidence."
      )
      return
    }

    await signOut()
    navigate('/login')
  }

  const sections = [
    { group: 'Mon compte' },
    { key: 'infos', label: 'Mes informations', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/mes%20informations%20trans%202.png' },
    { key: 'mesdocs', label: 'Mes documents', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/documents%20trans.png', action: () => navigate('/mes-documents') },
    { group: 'La residence' },
    { key: 'residence', label: 'Ma residence', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/ma%20residence.png', action: () => navigate('/ma-residence') },
    { key: 'regles', label: 'Regles de la copropriete', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/regle%20de%20coprop%20trans.png', action: () => navigate('/rules') },
    { key: 'guide', label: "Guide d'utilisation", img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/guide%20utilisation%20trans%202.png', action: () => navigate('/guide') },
    ...(profile?.role === 'admin' || profile?.role === 'syndic' ? [
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
          <div style={{ position: 'relative' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', color: 'var(--cream)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 600
              }}>
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
            )}
            <label style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--cream)', border: '2px solid var(--green-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 11
            }}>
              📷
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </label>
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
          {sections.map((item) => {
            if (item.group) return (
              <div key={'g' + item.group} style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: 1,
                margin: '18px 0 6px', paddingLeft: 4
              }}>{item.group}</div>
            )
            const { key, label, action, img } = item
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
                    <img src={img} alt={label} style={{ width: 68, height: 68, objectFit: 'contain' }} />
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
                    <ReglagesNotifications />
                    <div style={{ marginTop: 12 }}>
                      <ChangePassword />
                    </div>
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
