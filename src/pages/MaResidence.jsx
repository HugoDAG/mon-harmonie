import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, ChevronDown, Home, QrCode, Printer } from 'lucide-react'
import { BUILDINGS } from '../lib/constants'

const REGISTER_URL = 'https://mon-harmonie.vercel.app/register'

export default function MaResidence() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [openBuilding, setOpenBuilding] = useState(null)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'syndic'

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, building, apartment, co_resident_id, account_status')
      .eq('account_status', 'approved')
      .order('building').order('apartment')

    const enriched = (data || []).map(r => {
      if (r.co_resident_id) {
        const co = (data || []).find(p => p.id === r.co_resident_id)
        return { ...r, co_resident_name: co?.first_name || null }
      }
      return r
    })
    setResidents(enriched)
    setLoading(false)
  }

  // Génère le QR code une fois la librairie et la page prêtes
  useEffect(() => {
    if (!isAdmin || loading) return
    const el = document.getElementById('qr-box')
    if (el && window.QRCode) {
      el.innerHTML = ''
      new window.QRCode(el, {
        text: REGISTER_URL, width: 170, height: 170,
        colorDark: '#4A5B3A', colorLight: '#ffffff'
      })
    }
  }, [isAdmin, loading])

  function qrDataUrl() {
    const el = document.getElementById('qr-box')
    if (!el) return ''
    const img = el.querySelector('img')
    if (img && img.src) return img.src
    const canvas = el.querySelector('canvas')
    if (canvas) return canvas.toDataURL('image/png')
    return ''
  }

  function printQR() {
    const data = qrDataUrl()
    if (!data) { alert('QR code pas encore prêt, réessayez dans un instant.'); return }
    const card = `
      <div class="card">
        <div class="res">Résidence Harmonie — Aix-en-Provence</div>
        <div class="title">Rejoignez l'application de la copropriété</div>
        <img src="${data}" width="170" height="170" />
        <div class="steps">
          1. Scannez ce QR code avec votre téléphone<br/>
          2. Créez votre compte et indiquez votre bâtiment et numéro d'appartement<br/>
          3. Un administrateur validera votre accès
        </div>
        <div class="duo">Vous vivez à deux ? Chacun crée son compte avec le même appartement : ils seront liés automatiquement.</div>
      </div>`
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>QR Mon Harmonie</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:10px;}
        .grid{display:flex;flex-wrap:wrap;justify-content:center;}
        .card{width:320px;border:1px dashed #999;border-radius:12px;padding:18px;margin:8px;text-align:center;}
        .res{font-size:11px;color:#4A5B3A;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;}
        .title{font-size:15px;font-weight:bold;color:#4A5B3A;margin-bottom:12px;}
        .card img{display:block;margin:0 auto 12px;}
        .steps{font-size:12px;color:#333;line-height:1.6;text-align:left;margin-bottom:10px;}
        .duo{font-size:10px;color:#777;line-height:1.4;}
        @media print {.card{page-break-inside:avoid;}}
      </style></head><body>
      <div class="grid">${card}${card}${card}${card}${card}${card}</div>
      <script>window.onload=function(){window.print();}</script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  function buildingResidents(building) {
    return residents.filter(r => r.building === building)
  }

  function displayName(r) {
    return r.co_resident_name
      ? `${r.first_name} & ${r.co_resident_name}`
      : `${r.first_name} ${r.last_name?.[0] || ''}.`
  }

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
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{residents.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Résidents inscrits</div>
          </div>
        </div>

        {/* QR code d'inscription (admin) */}
        {isAdmin && (
          <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
              <QrCode size={16} color="var(--green-dark)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-dark)', fontFamily: "'Cinzel', serif" }}>QR code d'inscription</span>
            </div>
            <div id="qr-box" style={{ display: 'flex', justifyContent: 'center', padding: 8 }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '8px 0 12px' }}>
              À imprimer et distribuer dans les boîtes aux lettres. Chaque résident scanne, crée son compte et indique son appartement.
            </p>
            <button onClick={printQR} className="btn btn-secondary" style={{ fontSize: 13 }}>
              <Printer size={15} /> Imprimer (6 par page)
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
        ) : (
          BUILDINGS.map(building => {
            const bRes = buildingResidents(building)
            // Un couple lié n'apparaît qu'une fois
            const households = []
            const seen = new Set()
            for (const r of bRes) {
              if (seen.has(r.id)) continue
              seen.add(r.id)
              if (r.co_resident_id) seen.add(r.co_resident_id)
              households.push(r)
            }
            const isOpen = openBuilding === building
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
                      {bRes.length === 0 ? 'Aucun résident inscrit' : `${bRes.length} résident${bRes.length > 1 ? 's' : ''} inscrit${bRes.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px', background: 'var(--white)' }}>
                    {bRes.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Aucun résident inscrit pour ce bâtiment.</p>
                    ) : (
                      households.map(r => (
                        <div key={r.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                          borderBottom: '1px solid var(--border-light)'
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, background: 'var(--green-50)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
                          }}>✅</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>{displayName(r)}</div>
                            {isAdmin && r.apartment && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Appartement {r.apartment}</div>
                            )}
                          </div>
                        </div>
                      ))
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
