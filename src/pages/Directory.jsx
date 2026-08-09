import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BUILDINGS } from '../lib/constants'
import BottomNav from '../components/BottomNav'
import { Search, Phone, Mail, Shield, UserCheck, Key } from 'lucide-react'

const ROLE_SECTIONS = [
  { key: 'syndic', label: 'Syndic', icon: Shield, color: 'var(--blue-500)', bg: 'var(--blue-50)' },
  { key: 'conseil', label: 'Conseil Syndical', icon: UserCheck, color: 'var(--purple-500)', bg: 'var(--purple-50)' },
  { key: 'gardien', label: 'Gardien(s)', icon: Key, color: 'var(--green-500)', bg: 'var(--green-50)' }
]

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
      .select('id, first_name, last_name, building, role, phone, email, co_resident_id')
      .eq('visible_in_directory', true)
      .order('role')
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

  const importantContacts = ROLE_SECTIONS.map(section => ({
    ...section,
    people: filtered.filter(r => r.role === section.key)
  })).filter(s => s.people.length > 0)

  const regularResidents = filtered.filter(r => r.role === 'resident' || !r.role)

  const grouped = regularResidents.reduce((acc, r) => {
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
          <>
            {/* Contacts importants */}
            {importantContacts.map(section => {
              const SectionIcon = section.icon
              return (
                <div key={section.key} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: section.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SectionIcon size={14} color={section.color} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: section.color, textTransform: 'uppercase', letterSpacing: 1 }}>{section.label}</span>
                  </div>
                  {section.people.map(r => (
                    <ContactCard key={r.id} person={r} accent={section.color} />
                  ))}
                </div>
              )
            })}

            {/* Résidents */}
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([building, people]) => (
              <div key={building} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Bâtiment {building}
                </div>
                {people.map(r => (
                  <ContactCard key={r.id} person={r} />
                ))}
              </div>
            ))}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
                <p style={{ fontSize: 14 }}>Aucun résident trouvé</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function ContactCard({ person, accent }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
      <div className="avatar" style={{ background: accent ? `${accent}15` : 'var(--blue-50)', color: accent || 'var(--blue-600)' }}>
        {person.first_name?.[0]}{person.last_name?.[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          {person.first_name} {person.last_name?.[0]}.
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Bâtiment {person.building}</div>
        {person.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
            <Phone size={11} /> {person.phone}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {person.phone && (
          <a href={`tel:${person.phone}`} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={14} color="var(--green-500)" />
          </a>
        )}
        {person.email && (
          <a href={`mailto:${person.email}`} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={14} color="var(--blue-500)" />
          </a>
        )}
      </div>
    </div>
  )
}
