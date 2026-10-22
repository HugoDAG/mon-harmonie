import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, ChevronDown, Plus, Trash2, Home, X, KeyRound, Printer, RotateCw } from 'lucide-react'
import { BUILDINGS } from '../lib/constants'

export default function MaResidence() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [apartments, setApartments] = useState([])
  const [residents, setResidents] = useState([])
  const [codes, setCodes] = useState({})          // { apartmentId: code }
  const [loading, setLoading] = useState(true)
  const [openBuilding, setOpenBuilding] = useState(null)
  const [newApt, setNewApt] = useState('')
  const [addingTo, setAddingTo] = useState(null)
  const [working, setWorking] = useState(false)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'syndic'

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: aptsData }, { data: resData }] = await Promise.all([
      supabase.from('apartments').select('id, building, number').order('building').order('number'),
      supabase.from('profiles').select('id, first_name, last_name, building, apartment, account_status, co_resident_id').eq('account_status', 'approved')
    ])
    setApartments(aptsData || [])

    const enriched = (resData || []).map(r => {
      if (r.co_resident_id) {
        const co = (resData || []).find(p => p.id === r.co_resident_id)
        return { ...r, co_resident_name: co?.first_name || null }
      }
      return r
    })
    setResidents(enriched)

    // Les codes ne sont lisibles que par l'admin/syndic (fonction sécurisée)
    if (isAdmin) {
      const { data: codeData } = await supabase.rpc('admin_apartment_codes')
      const map = {}
      ;(codeData || []).forEach(c => { map[c.id] = c.access_code })
      setCodes(map)
    }
    setLoading(false)
  }

  async function addApartment(building) {
    if (!newApt.trim()) return
    const { error } = await supabase.from('apartments').insert({ building, number: newApt.trim().toUpperCase() })
    if (error) {
      if (error.code === '23505') alert('Cet appartement existe déjà')
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

  async function generateCodes() {
    setWorking(true)
    const { error } = await supabase.rpc('generate_apartment_codes')
    setWorking(false)
    if (error) { alert('Erreur : ' + error.message); return }
    fetchAll()
  }

  async function regenerate(id) {
    if (!confirm("Régénérer le code de cet appartement ? L'ancien code ne fonctionnera plus.")) return
    const { error } = await supabase.rpc('regenerate_apartment_code', { p_id: id })
    if (error) { alert('Erreur : ' + error.message); return }
    fetchAll()
  }

  function printCodes() {
    const list = apartments.filter(a => codes[a.id])
    if (list.length === 0) { alert("Aucun code à imprimer. Générez d'abord les codes."); return }
    const cards = list.map(a => `
      <div class="card">
        <div class="res">Résidence Harmonie</div>
        <div class="apt">Bâtiment ${a.building} &middot; Appartement ${a.number}</div>
        <div class="code">${codes[a.id]}</div>
        <div class="note">Saisissez ce code lors de votre inscription sur l'application <b>Mon Harmonie</b>.<br/>Valable pour 2 comptes (vous + votre co-résident).</div>
      </div>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Codes Mon Harmonie</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:12px;}
        h1{font-size:16px;color:#4A5B3A;margin:4px 8px 12px;}
        .grid{display:flex;flex-wrap:wrap;}
        .card{width:250px;border:1px dashed #999;border-radius:10px;padding:14px;margin:6px;}
        .res{font-size:10px;color:#4A5B3A;letter-spacing:1px;text-transform:uppercase;}
        .apt{font-size:14px;font-weight:bold;margin:6px 0;}
        .code{font-size:22px;font-weight:bold;letter-spacing:2px;font-family:monospace;color:#C4794E;margin:8px 0;}
        .note{font-size:10px;color:#555;line-height:1.4;}
        @media print {.card{page-break-inside:avoid;}}
      </style></head><body>
      <h1>Codes d'accès &mdash; Mon Harmonie (à découper et distribuer dans les boîtes aux lettres)</h1>
      <div class="grid">${cards}</div>
      <script>window.onload=function(){window.print();}</script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  function apartmentResidents(building, number) {
    return residents.filter(r => r.building === building && r.apartment === number)
  }

  function getBuildingStats(building) {
    const bApts = apartments.filter(a => a.building === building)
    const occupied = bApts.filter(a => apartmentResidents(building, a.number).length > 0).length
    return { total: bApts.length, occupied }
  }

  const codesCount = Object.keys(codes).length
  const missingCodes = isAdmin && apartments.some(a => !codes[a.id])

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Ma résidence</h1>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 16, padding: '14px 16px',
          background: 'var(--green-dark)', borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{BUILDINGS.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Bâtiments</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{apartments.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Appartements</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{residents.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Résidents</div>
          </div>
        </div>

        {/* Actions admin : codes */}
        {isAdmin && apartments.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={generateCodes} disabled={working} className="btn btn-secondary" style={{ flex: 1, fontSize: 12, minWidth: 150 }}>
              <KeyRound size={15} /> {working ? 'Génération...' : (missingCodes ? 'Générer les codes manquants' : 'Codes générés')}
            </button>
            <button onClick={printCodes} className="btn btn-secondary" style={{ flex: 1, fontSize: 12, minWidth: 130 }}>
              <Printer size={15} /> Imprimer les codes
            </button>
          </div>
        )}

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
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green-dark)' }}>Bâtiment {building}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {stats.total === 0 ? 'Aucun appartement' : `${stats.occupied}/${stats.total} présents dans l'app`}
                    </div>
                  </div>
                  <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px', background: 'var(--white)' }}>
                    {bApts.length === 0 && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Aucun appartement enregistré</p>
                    )}

                    {bApts.map(apt => {
                      const apRes = apartmentResidents(building, apt.number)
                      const count = apRes.length
                      const names = apRes.map(r => r.co_resident_name ? `${r.first_name} & ${r.co_resident_name}` : `${r.first_name} ${r.last_name?.[0] || ''}.`).join(' · ')
                      const statusLabel = count === 0 ? 'Non activé' : count >= 2 ? 'Complet (2 comptes)' : '1 compte'
                      return (
                        <div key={apt.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: count > 0 ? 'var(--green-50)' : 'var(--cream)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
                            }}>
                              {count > 0 ? '✅' : '🔲'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>
                                {count > 0 ? names : `Appartement ${apt.number}`}
                              </div>
                              <div style={{ fontSize: 12, color: count > 0 ? 'var(--green-500)' : 'var(--text-muted)' }}>
                                {statusLabel}
                              </div>
                            </div>
                            {isAdmin && count === 0 && (
                              <button onClick={() => deleteApartment(apt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <Trash2 size={14} color="var(--red-500)" />
                              </button>
                            )}
                          </div>

                          {/* Code (admin seulement) */}
                          {isAdmin && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, paddingLeft: 42 }}>
                              <KeyRound size={13} color="var(--terracotta)" />
                              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--terracotta)', letterSpacing: 1 }}>
                                {codes[apt.id] || '— (générer les codes)'}
                              </span>
                              {codes[apt.id] && (
                                <button onClick={() => regenerate(apt.id)} title="Régénérer" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginLeft: 'auto' }}>
                                  <RotateCw size={13} color="var(--text-muted)" />
                                </button>
                              )}
                            </div>
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

        {isAdmin && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            Ajoutez les appartements, générez les codes, puis imprimez-les pour les distribuer dans les boîtes aux lettres. Chaque code permet 2 comptes (un couple).
          </p>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
