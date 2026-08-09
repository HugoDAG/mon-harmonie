import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'
import { Calendar, Plus, X, Info } from 'lucide-react'

const EVENT_TYPES = [
  { key: 'ag', label: 'Assemblée Générale', color: 'var(--blue-500)', bg: 'var(--blue-50)' },
  { key: 'conseil', label: 'Conseil Syndical', color: 'var(--purple-500)', bg: 'var(--purple-50)' },
  { key: 'travaux', label: 'Travaux', color: 'var(--amber-500)', bg: 'var(--amber-50)' },
  { key: 'activite', label: 'Activité', color: 'var(--green-500)', bg: 'var(--green-50)' },
  { key: 'info', label: 'Information', color: 'var(--gray-500)', bg: 'var(--gray-50)' }
]

export default function CalendarPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', event_date: '', event_time: '', event_type: 'info' })

  const canCreate = profile?.role === 'syndic' || profile?.role === 'admin' || profile?.role === 'conseil'

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date')
      .order('event_time')
    setEvents(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    await supabase.from('events').insert({
      ...form,
      event_time: form.event_time || null,
      created_by: profile.id
    })
    setShowForm(false)
    setForm({ title: '', description: '', event_date: '', event_time: '', event_type: 'info' })
    fetchEvents()
  }

  function groupByMonth(events) {
    return events.reduce((acc, ev) => {
      const date = new Date(ev.event_date)
      const key = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      if (!acc[key]) acc[key] = []
      acc[key].push(ev)
      return acc
    }, {})
  }

  const grouped = groupByMonth(events)

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Calendrier</h1>
          {canCreate && (
            <button className="btn btn-secondary" onClick={() => setShowForm(s => !s)} style={{ fontSize: 13 }}>
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Annuler' : 'Ajouter'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--blue-50)', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 12, color: 'var(--blue-600)' }}>
          <Info size={14} />
          À titre informatif — consultez vos convocations pour les détails officiels.
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Titre</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: AG annuelle 2027" required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Heure (optionnel)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} style={{ flex: 1 }} />
                {form.event_time && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, event_time: '' }))} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Description (optionnel)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails, lieu, ordre du jour…" rows={3} />
            </div>
            <button type="submit" className="btn btn-primary">Créer l'événement</button>
          </form>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>Chargement…</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
            <Calendar size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p style={{ fontSize: 14 }}>Aucun événement à venir</p>
          </div>
        ) : (
          Object.entries(grouped).map(([month, evts]) => (
            <div key={month} style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 10, textTransform: 'capitalize' }}>
                {month}
              </h2>
              {evts.map(ev => {
                const typeInfo = EVENT_TYPES.find(t => t.key === ev.event_type) || EVENT_TYPES[4]
                const date = new Date(ev.event_date)
                return (
                  <div key={ev.id} className="card" style={{ display: 'flex', gap: 12, padding: '12px 14px' }}>
                    <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                        {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--gray-800)' }}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{ev.title}</span>
                        <span className="tag" style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: 10 }}>
                          {typeInfo.label}
                        </span>
                      </div>
                      {ev.event_time && (
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 2 }}>
                          {ev.event_time.slice(0, 5)}
                        </div>
                      )}
                      {ev.description && (
                        <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>{ev.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}
