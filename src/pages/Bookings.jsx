import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { CalendarCheck, Plus, X, Clock, ArrowLeft, Trash2, Info } from 'lucide-react'

// Horaires imposés par l'AG pour le terrain de pétanque
function petanqueWindow(dateStr) {
  if (!dateStr) return null
  const m = new Date(dateStr + 'T00:00:00').getMonth() + 1 // 1 = janvier
  const ete = m >= 4 && m <= 9
  return ete
    ? { start: '11:00', end: '21:00', label: 'Été (avril à septembre) : 11h – 21h' }
    : { start: '10:00', end: '18:00', label: 'Hiver (octobre à mars) : 10h – 18h' }
}

export default function Bookings() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ space_id: '', date: '', start_time: '', end_time: '' })
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: spacesData }, { data: bookingsData }] = await Promise.all([
      supabase.from('spaces').select('*').order('name'),
      supabase.from('bookings').select('*, space:spaces(name), profile:profiles(first_name, last_name, building)')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('start_time')
    ])
    setSpaces(spacesData || [])
    setBookings(bookingsData || [])
    setLoading(false)
  }

  function selectedSpace() {
    return spaces.find(s => s.id === form.space_id)
  }

  function isPetanque() {
    const s = selectedSpace()
    return s && s.name.toLowerCase().includes('pétanque')
  }

  async function handleBook(e) {
    e.preventDefault()

    // Contrôle des horaires pour le terrain de pétanque
    if (isPetanque()) {
      const w = petanqueWindow(form.date)
      if (w && (form.start_time < w.start || form.end_time > w.end)) {
        alert(`Le terrain de pétanque est réservable uniquement sur le créneau autorisé par l'AG.\n${w.label}`)
        return
      }
    }
    if (form.start_time >= form.end_time) {
      alert("L'heure de fin doit être après l'heure de début.")
      return
    }

    await supabase.from('bookings').insert({ ...form, user_id: user.id })
    setShowForm(false)
    setForm({ space_id: '', date: '', start_time: '', end_time: '' })
    fetchData()
  }

  async function handleDelete(id) {
    await supabase.from('bookings').delete().eq('id', id)
    setDeletingId(null)
    fetchData()
  }

  const petWindow = isPetanque() ? petanqueWindow(form.date) : null

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
              <ArrowLeft size={22} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Réserver</h1>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowForm(s => !s)} style={{ fontSize: 13 }}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Annuler' : 'Réserver'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleBook} className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Espace</label>
              <select value={form.space_id} onChange={e => setForm(f => ({ ...f, space_id: e.target.value }))} required>
                <option value="">Choisir un espace...</option>
                {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
            </div>

            {petWindow && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--green-sage-10)', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.5 }}>
                <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>Créneau autorisé par l'AG pour le terrain de pétanque — <strong>{petWindow.label}</strong></span>
              </div>
            )}

            <div className="form-group">
              <label>De</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required
                min={petWindow?.start} max={petWindow?.end} />
            </div>
            <div className="form-group">
              <label>À</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required
                min={petWindow?.start} max={petWindow?.end} />
            </div>
            <button type="submit" className="btn btn-primary">Confirmer</button>
          </form>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
            <CalendarCheck size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p style={{ fontSize: 14 }}>Aucune réservation à venir</p>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarCheck size={18} color="var(--green-600)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{b.space?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} />
                  {new Date(b.date).toLocaleDateString('fr-FR')} · {b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {b.profile?.first_name} {b.profile?.last_name?.[0]}. – {b.profile?.building}
                </div>
              </div>
              {b.user_id === user.id && (
                deletingId === b.id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleDelete(b.id)} style={{ background: 'var(--red-500)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>Oui</button>
                    <button onClick={() => setDeletingId(null)} style={{ background: 'var(--cream)', border: 'none', borderRadius: 'var(--radius)', padding: '6px 10px', fontSize: 11, cursor: 'pointer', color: 'var(--text-muted)' }}>Non</button>
                  </div>
                ) : (
                  <button onClick={() => setDeletingId(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={16} color="var(--text-muted)" />
                  </button>
                )
              )}
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}
