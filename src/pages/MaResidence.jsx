import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, ChevronDown, Plus, Trash2, Home, X } from 'lucide-react'
import { BUILDINGS } from '../lib/constants'

export default function MaResidence() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [apartments, setApartments] = useState([])
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [openBuilding, setOpenBuilding] = useState(null)
  const [newApt, setNewApt] = useState('')
  const [addingTo, setAddingTo] = useState(null)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'syndic'

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: aptsData }, { data: resData }] = await Promise.all([
      supabase.from('apartments').select('*').order('building').order('number', { ascending: true }),
      supabase.from('profiles').select('id, first_name, last_name, building, apartment, account_status, co_resident_id').eq('account_status', 'approved')
    ])
    setApartments(aptsData || [])

    // Enrichir avec les noms des co-résidents
    const enriched = (resData || []).map(r => {
      if (r.co_resident_id) {
        const coResident = (resData || []).find(p => p.id === r.co_resident_id)
        return { ...r, co_resident_name: coResident?.first_name || null }
      }
      return r
    })
    setResidents(enriched)
    setLoading(false)
  }

  async function addApartment(building) {
    if (!newApt.trim()) return
    const { error } = await supabase.from('apartments').insert({ building, number: newApt.trim().toUpperCase() })
    if (error) {
      if (error.code === '23505') alert('Cet appartement existe deja')
      else alert('Erreur : ' + error.message)
    } else {
      setNewApt('')
      setAddingTo(null)
      fetchAll()
    }
  }

  async function deleteApartment(id) {
    if (confirm('Supprimer cet appartement ?')) {
      await supabase.from('apartments').delete().eq('id', id)
      fetchAll()
    }
  }

  function getResidentForApt(building, number) {
    return residents.find(r => r.building === building && r.apartment === number)
  }

  function getBuildingStats(building) {
    const bApts = apartments.filter(a => a.building === building)
    const occupied = bApts.filter(a => getResidentForApt(building, a.number)).length
    return { total: bApts.length, occupied }
  }

  function getDisplayName(resident) {
    const name = `${resident.first_name} ${resident.last_name?.[0]}.`
    if (resident.co_resident_name) {
      return `${resident.first_name} & ${resident.co_resident_name}`
    }
    return name
  }

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Ma residence</h1>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 20, padding: '14px 16px',
          background: 'var(--green-dark)', borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{BUILDINGS.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Batiments</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{apartments.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Appartements</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{residents.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Residents</div>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
        ) : (
          BUILDINGS.map(building => {
            const stats = getBuildingStats(building)
            const isOpen = openBuilding === building
            const bApts = apartments.filter(a => a.building === building)

            return (
              <div key={building} style={{ marginBottom: 4, borderBottom: '1px solid var(--border-light)' }}>
                <button onClick={() => setOpenBuilding(isOpen ? null : building)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '14px 16px', background: 'var(--white)',
                  border: 'none', cursor: 'pointer', textAlign: 'left'
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--cream)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Home size={18} color="var(--green-sage)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green-dark)' }}>Batiment {building}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {stats.total === 0 ? 'Aucun appartement' : `${stats.occupied}/${stats.total} presents dans l'app`}
                    </div>
                  </div>
                  <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px', background: 'var(--white)' }}>
                    {bApts.length === 0 && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Aucun appartement enregistre</p>
                    )}

                    {bApts.map(apt => {
                      const resident = getResidentForApt(building, apt.number)
                      const occupied = !!resident
                      return (
                        <div key={apt.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                          borderBottom: '1px solid var(--border-light)'
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: occupied ? 'var(--green-50)' : 'var(--cream)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12
                          }}>
                            {occupied ? '✅' : '🔲'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>
                              {resident ? getDisplayName(resident) : 'Vacant'}
                            </div>
                            <div style={{ fontSize: 12, color: occupied ? 'var(--green-500)' : 'var(--text-muted)' }}>
                              {occupied ? "Present dans l'app" : "Non present dans l'app"}
                            </div>
                          </div>
                          {isAdmin && !occupied && (
                            <button onClick={() => deleteApartment(apt.id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 4
                            }}>
                              <Trash2 size={14} color="var(--red-500)" />
                            </button>
                          )}
                        </div>
                      )
                    })}

                    {isAdmin && (
                      <div style={{ marginTop: 10 }}>
                        {addingTo === building ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={newApt}
                              onChange={e => setNewApt(e.target.value)}
                              placeholder="Ex: C223"
                              style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
                              onKeyDown={e => e.key === 'Enter' && addApartment(building)}
                            />
                            <button onClick={() => addApartment(building)} style={{
                              background: 'var(--green-dark)', color: '#fff', border: 'none',
                              borderRadius: 'var(--radius)', padding: '8px 12px', cursor: 'pointer'
                            }}>
                              <Plus size={16} />
                            </button>
                            <button onClick={() => { setAddingTo(null); setNewApt('') }} style={{
                              background: 'var(--cream)', border: 'none',
                              borderRadius: 'var(--radius)', padding: '8px 12px', cursor: 'pointer'
                            }}>
                              <X size={16} color="var(--text-muted)" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setAddingTo(building)} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'none', border: 'none', color: 'var(--green-sage)',
                            fontSize: 13, cursor: 'pointer', padding: '4px 0'
                          }}>
                            <Plus size={14} /> Ajouter un appartement
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}
