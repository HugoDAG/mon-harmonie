import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BUILDINGS } from '../lib/constants'
import BottomNav from '../components/BottomNav'
import { Search } from 'lucide-react'

export default function Directory() {
  const [residents, setResidents] = useState([])
  const [filter, setFilter] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchResidents() }, [buildingFilter])

  async function fetchResidents() {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, building, co_resident:profiles!profiles_co_resident_id_fkey(first_name, last_name)')
      .eq('visible_in_directory', true)
      .order('building')
      .order('first_name')

    if (buildingFilter) query = query.eq('building', buildingFilter)

    const { data } = await query
    setResidents(data || [])
    setLoading(false)
  }

  const filtered = residents.filter(r => {
    if (!filter) return true
    const name = `${r.first_name} ${r.last_name}`.toLowerCase()
    return name.includes(filter.toLowerCase())
  })

  const grouped = filtered.reduce((acc, r) => {
    const b = r.building || '?'
    if (!acc[b]) acc[b] = []
    acc[b].push(r)
    return acc
  }, {})

  return (
    <div className="app-shell">
      <div className="page-content">
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Annuaire</h1>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--gray-400)' }} />
          <input
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 14 }}
            placeholder="Rechercher un résident…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        <select
          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 14, marginBottom: 16, color: buildingFilter ? 'var(--gray-900)' : 'var(--gray-400)' }}
          value={buildingFilter}
          onChange={e => setBuildingFilter(e.target.value)}
        >
          <option value="">Tous les bâtiments</option>
          {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>Chargement…</p>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([building, people]) => (
            <div key={building} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Bâtiment {building}
              </div>
              {people.map(r => (
                <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                  <div className="avatar" style={{ background: 'var(--blue-50)', color: 'var(--blue-600)' }}>
                    {r.first_name?.[0]}{r.last_name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {r.first_name} {r.last_name?.[0]}.
                      {r.co_resident && ` & ${r.co_resident.first_name}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Bâtiment {r.building}</div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}
