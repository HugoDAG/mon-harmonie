import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react'

const EVENT_TYPES = [
  { key: 'ag', label: 'Assemblée Générale', color: 'var(--terracotta)', bg: 'rgba(196,121,78,0.1)' },
  { key: 'conseil', label: 'Conseil Syndical', color: 'var(--purple-500)', bg: 'var(--purple-50)' },
  { key: 'travaux', label: 'Travaux', color: 'var(--amber-500)', bg: 'var(--amber-50)' },
  { key: 'encombrants', label: 'Encombrants', color: '#B8913F', bg: 'rgba(217,178,109,0.15)' },
  { key: 'activite', label: 'Activité', color: 'var(--green-sage)', bg: 'var(--green-sage-10)' },
  { key: 'info', label: 'Information', color: 'var(--text-light)', bg: 'var(--cream)' }
]

const REPEAT_OPTIONS = [
  { key: 'none', label: 'Pas de répétition' },
  { key: 'weekly', label: 'Chaque semaine' },
  { key: 'biweekly', label: 'Toutes les 2 semaines' },
  { key: 'monthly', label: 'Chaque mois' }
]

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const EMPTY_FORM = { title: '', description: '', event_date: '', event_time: '', event_type: 'info', repeat: 'none', occurrences: 6 }

export default function CalendarPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const canCreate = profile?.role === 'syndic' || profile?.role === 'admin' || profile?.role === 'conseil'

  useEffect(() => { fetchEvents() }, [currentDate])

  async function fetchEvents() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = toDateStr(new Date(year, month, 1))
    const end = toDateStr(new Date(year, month + 1, 0))

    const { data } = await supabase.from('events').select('*')
      .gte('event_date', start).lte('event_date', end)
      .order('event_date').order('event_time')
    setEvents(data || [])
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title || !form.event_date) return
    setSaving(true)

    const base = new Date(form.event_date + 'T00:00:00')
    const count = form.repeat === 'none' ? 1 : Math.min(Math.max(parseInt(form.occurrences) || 1, 1), 52)
    const rows = []

    for (let i = 0; i < count; i++) {
      const d = new Date(base)
      if (form.repeat === 'weekly') d.setDate(base.getDate() + 7 * i)
      if (form.repeat === 'biweekly') d.setDate(base.getDate() + 14 * i)
      if (form.repeat === 'monthly') d.setMonth(base.getMonth() + i)
      rows.push({
        title: form.title,
        description: form.description || null,
        event_date: toDateStr(d),
        event_time: form.event_time || null,
        event_type: form.event_type,
        created_by: profile.id
      })
    }

    const { error } = await supabase.from('events').insert(rows)
    setSaving(false)
    if (error) { alert('Erreur : ' + error.message); return }

    setShowForm(false)
    setForm(EMPTY_FORM)
    fetchEvents()
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) alert('Erreur : ' + error.message)
    setDeletingId(null)
    fetchEvents()
  }

  function prevMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  function getDaysInMonth() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7
    const days = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    return days
  }

  function getDateStr(day) {
    if (!day) return ''
    return toDateStr(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
  }

  function getDayTypes(day) {
    const dateStr = getDateStr(day)
    return [...new Set(events.filter(e => e.event_date === dateStr).map(e => e.event_type))]
  }

  const today = toDateStr(new Date())
  const selectedEvents = events.filter(e => e.event_date === selectedDate)
  const calendarDays = getDaysInMonth()

  return (
    <div className="app-shell">
      <div className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Calendrier</h1>
          {canCreate && (
            <button className="btn btn-secondary" onClick={() => setShowForm(s => !s)} style={{ fontSize: 13 }}>
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Annuler' : 'Ajouter'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Titre</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Collecte des encombrants" required />
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
                  <button type="button" onClick={() => setForm(f => ({ ...f, event_time: '' }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Répéter</label>
              <select value={form.repeat} onChange={e => setForm(f => ({ ...f, repeat: e.target.value }))}>
                {REPEAT_OPTIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
            {form.repeat !== 'none' && (
              <div className="form-group">
                <label>Nombre d'occurrences</label>
                <input type="number" min={1} max={52} value={form.occurrences} onChange={e => setForm(f => ({ ...f, occurrences: e.target.value }))} />
                <p className="form-hint">Ex : 12 pour une collecte mensuelle sur un an</p>
              </div>
            )}
            <div className="form-group">
              <label>Description (optionnel)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails, lieu, consignes..." rows={3} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Création...' : 'Créer'}
            </button>
          </form>
        )}

        {/* Calendar grid */}
        <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronLeft size={20} color="var(--green-dark)" />
            </button>
            <span style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ChevronRight size={20} color="var(--green-dark)" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
            {DAYS.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />
              const dateStr = getDateStr(day)
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              const dayTypes = getDayTypes(day)
              return (
                <button key={i} onClick={() => setSelectedDate(dateStr)} style={{
                  width: '100%', aspectRatio: '1', borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                  background: isSelected ? 'var(--green-dark)' : isToday ? 'var(--cream)' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? 'var(--green-dark)' : 'var(--text-dark)',
                  fontWeight: isToday || isSelected ? 600 : 400,
                  fontSize: 14, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {day}
                  {dayTypes.length > 0 && (
                    <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                      {dayTypes.slice(0, 3).map(t => {
                        const info = EVENT_TYPES.find(et => et.key === t) || EVENT_TYPES[5]
                        return <div key={t} style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : info.color }} />
                      })}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected date events */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-dark)', marginBottom: 10, fontFamily: "'Cinzel', serif" }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>

          {selectedEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px 0' }}>Aucun événement ce jour</p>
          ) : (
            selectedEvents.map(ev => {
              const typeInfo = EVENT_TYPES.find(t => t.key === ev.event_type) || EVENT_TYPES[5]
              return (
                <div key={ev.id} style={{
                  display: 'flex', gap: 12, padding: '12px 14px', marginBottom: 8,
                  borderLeft: `3px solid ${typeInfo.color}`, background: typeInfo.bg,
                  borderRadius: '0 var(--radius) var(--radius) 0'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)', marginBottom: 2 }}>{ev.title}</div>
                    {ev.event_time && (
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{ev.event_time.slice(0, 5)}</div>
                    )}
                    {ev.description && (
                      <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4, lineHeight: 1.5 }}>{ev.description}</p>
                    )}
                    <span style={{ fontSize: 10, color: typeInfo.color, fontWeight: 500 }}>{typeInfo.label}</span>
                  </div>
                  {canCreate && (
                    deletingId === ev.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                        <button onClick={() => handleDelete(ev.id)} style={{ background: 'var(--red-500)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Oui</button>
                        <button onClick={() => setDeletingId(null)} style={{ background: 'var(--white)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: 'var(--text-muted)' }}>Non</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, alignSelf: 'flex-start' }}>
                        <Trash2 size={14} color="var(--text-muted)" />
                      </button>
                    )
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
