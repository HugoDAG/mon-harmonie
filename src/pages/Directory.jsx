import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { BUILDINGS } from '../lib/constants'
import BottomNav from '../components/BottomNav'
import { Search, Phone, Mail, Plus, X, Trash2, Pencil, Check } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'syndic', label: 'Syndic' },
  { value: 'gardien', label: 'Gardien' },
  { value: 'conseil', label: 'Conseil Syndical' },
  { value: 'prestataire', label: 'Prestataire' },
  { value: 'urgence', label: 'Numéro d\'urgence' },
  { value: 'autre', label: 'Autre' }
]

const ROLE_COLORS = {
  syndic: { color: 'var(--blue-500)', bg: 'var(--blue-50)' },
  gardien: { color: 'var(--green-500)', bg: 'var(--green-50)' },
  conseil: { color: 'var(--purple-500)', bg: 'var(--purple-50)' },
  prestataire: { color: 'var(--amber-500)', bg: 'var(--amber-50)' },
  urgence: { color: 'var(--red-500)', bg: 'var(--red-50)' },
  autre: { color: 'var(--gray-500)', bg: 'var(--gray-50)' }
}

export default function Directory() {
  const { profile } = useAuth()
  const [contacts, setContacts] = useState([])
  const [residents, setResidents] = useState([])
  const [filter, setFilter] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [form, setForm] = useState({ name: '', role_label: 'gardien', phone: '', email: '', building: '' })

  const canEdit = profile?.role === 'syndic' || profile?.role === 'admin' || profile?.role === 'conseil'

  useEffect(() => {
    fetchAll()
  }, [buildingFilter])

  async function fetchAll() {
    setLoading(true)
    const [{ data: contactsData }, { data: residentsData }] = await Promise.all([
      supabase.from('directory_contacts').select('*').order('role_label').order('name'),
      supabase.from('profiles').select('id, first_name, last_name, building, role, phone, email, co_resident_id')
        .eq('visible_in_directory', true)
        .eq('role', 'resident')
        .order('building').order('first_name')
    ])
    setContacts(contactsData || [])
    let r = residentsData || []
    if (buildingFilter) r = r.filter(p => p.building === buildingFilter)
    setResidents(r)
    setLoading(false)
  }

  const filteredContacts = contacts.filter(c => {
    if (!filter) return true
    return c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.role_label.toLowerCase().includes(filter.toLowerCase())
  })

  const filteredResidents = residents.filter(r => {
    if (!filter) return true
    const name = `${r.first_name} ${r.last_name}`.toLowerCase()
    return name.includes(filter.toLowerCase())
  })

  const groupedContacts = filteredContacts.reduce((acc, c) => {
    const role = c.role_label || 'autre'
    if (!acc[role]) acc[role] = []
    acc[role].push(c)
    return acc
  }, {})

  const groupedResidents = filteredResidents.reduce((acc, r) => {
    const b = r.building || '?'
    if (!acc[b]) acc[b] = []
    acc[b].push(r)
    return acc
  }, {})

  function openEditForm(contact) {
    setForm({
      name: contact.name,
      role_label: contact.role_label,
      phone: contact.phone || '',
      email: contact.email || '',
      building: contact.building || ''
    })
    setEditingContact(contact)
    setShowForm(true)
  }

  function openNewForm() {
    setForm({ name: '', role_label: 'gardien', phone: '', email: '', building: '' })
    setEditingContact(null)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    const payload = {
      name: form.name.trim(),
      role_label: form.role_label,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      building: form.building || null
    }

    if (editingContact) {
      await supabase.from('directory_contacts').update(payload).eq('id', editingContact.id)
    } else {
      await supabase.from('directory_contacts').insert({ ...payload, created_by: profile.id })
    }

    setShowForm(false)
    setEditingContact(null)
    fetchAll()
  }

  async function handleDelete(id) {
    if (confirm('Supprimer ce contact ?')) {
      await supabase.from('directory_contacts').delete().eq('id', id)
      fetchAll()
    }
  }

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Annuaire</h1>
          {canEdit && (
            <button className="btn btn-secondary" onClick={() => showForm ? setShowForm(false) : openNewForm()} style={{ fontSize: 13 }}>
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Annuler' : 'Ajouter'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Nom</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Jean Dupont" required />
            </div>
            <div className="form-group">
              <label>Fonction</label>
              <select value={form.role_label} onChange={e => setForm(f => ({ ...f, role_label: e.target.value }))}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@email.com" />
            </div>
            <div className="form-group">
              <label>Bâtiment (optionnel)</label>
              <select value={form.building} onChange={e => setForm(f => ({ ...f, building: e.target.value }))}>
                <option value="">Tous / Non applicable</option>
                {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              {editingContact ? 'Modifier' : 'Ajouter le contact'}
            </button>
          </form>
        )}

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--gray-400)' }} />
          <input
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 14 }}
            placeholder="Rechercher…"
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
            {Object.entries(groupedContacts).map(([role, people]) => {
              const roleInfo = ROLE_COLORS[role] || ROLE_COLORS.autre
              const roleLabel = ROLE_OPTIONS.find(r => r.value === role)?.label || role
              return (
                <div key={role} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: roleInfo.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {roleLabel}
                  </div>
                  {people.map(c => (
                    <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                      <div className="avatar" style={{ background: roleInfo.bg, color: roleInfo.color }}>
                        {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                        {c.building && <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Bâtiment {c.building}</div>}
                        {c.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                            <Phone size={11} /> {c.phone}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.phone && (
                          <a href={`tel:${c.phone}`} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Phone size={14} color="var(--green-500)" />
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail size={14} color="var(--blue-500)" />
                          </a>
                        )}
                        {canEdit && (
                          <>
                            <button onClick={() => openEditForm(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                              <Pencil size={14} color="var(--gray-400)" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={14} color="var(--red-500)" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Résidents */}
            {Object.entries(groupedResidents).sort(([a], [b]) => a.localeCompare(b)).map(([building, people]) => (
              <div key={building} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Bâtiment {building}
                </div>
                {people.map(r => (
                  <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                    <div className="avatar" style={{ background: 'var(--blue-50)', color: 'var(--blue-600)' }}>
                      {r.first_name?.[0]}{r.last_name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{r.first_name} {r.last_name?.[0]}.</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Bâtiment {r.building}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {filteredContacts.length === 0 && filteredResidents.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
                <p style={{ fontSize: 14 }}>Aucun contact trouvé</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
