import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'

const EVENT_TYPES = [
  { key: 'ag', label: 'Assemblée Générale', color: 'var(--terracotta)', bg: 'rgba(196,121,78,0.1)' },
  { key: 'conseil', label: 'Conseil Syndical', color: 'var(--purple-500)', bg: 'var(--purple-50)' },
  { key: 'travaux', label: 'Travaux', color: 'var(--amber-500)', bg: 'var(--amber-50)' },
  { key: 'activite', label: 'Activité', color: 'var(--green-sage)', bg: 'var(--green-sage-10)' },
  { key: 'info', label: 'Information', color: 'var(--text-light)', bg: 'var(--cream)' }
]

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export default function CalendarPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', event_date: '', event_time: '', event_type: 'info' })

  const canCreate = profile?.role === 'syndic' || profile?.role === 'admin' || profile?.role === 'conseil'

  useEffect(() => { fetchEvents() }, [currentDate])

  async function fetchEvents() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const start = new Date(year, month, 1).toISOString().split('T')[0]
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data } = await supabase.from('events').select('*').gte('event_date', start).lte('event_date', end).order('event_date').order('event_time')
    setEvents(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    await supabase.from('events').insert({ ...form, event_time: form.event_time || null, created_by: profile.id })
    setShowForm(false)
    setForm({ title: '', description: '', event_date: '', event_time: '', event_type: 'info' })
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
    const y = currentDate.getFullYear()
    const m = String(currentDate.getMonth() + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function hasEvents(day) {
    return events.some(e => e.event_date === getDateStr(day))
  }

  const today = new Date().toISOString().split('T')[0]
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
                  <button type="button" onClick={() => setForm(f => ({ ...f, event_time: '' }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Description (optionnel)</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails, lieu, ordre du jour..." rows={3} />
            </div>
            <button type="submit" className="btn btn-primary">Créer</button>
          </form>
        )}

        {/* Calendar grid */}
        <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
          {/* Month nav */}
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

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginBottom: 8 }}>
            {DAYS.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />
              const dateStr = getDateStr(day)
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              const hasEvt = hasEvents(day)
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
                  {hasEvt && (
                    <div style={{
                      position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 5, height: 5, borderRadius: '50%',
                      background: isSelected ? '#fff' : 'var(--terracotta)'
                    }} />
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
              const typeInfo = EVENT_TYPES.find(t => t.key === ev.event_type) || EVENT_TYPES[4]
              return (
                <div key={ev.id} style={{
                  display: 'flex', gap: 12, padding: '12px 14px', marginBottom: 8,
                  borderLeft: `3px solid ${typeInfo.color}`, background: typeInfo.bg,
                  borderRadius: '0 var(--radius) var(--radius) 0'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)', marginBottom: 2 }}>{ev.title}</div>
                    {ev.event_time && (
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{ev.event_time.slice(0, 5)}</div>
                    )}
                    {ev.description && (
                      <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4, lineHeight: 1.5 }}>{ev.description}</p>
                    )}
                    <span style={{ fontSize: 10, color: typeInfo.color, fontWeight: 500 }}>{typeInfo.label}</span>
                  </div>
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
