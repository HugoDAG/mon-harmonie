import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { CHANNELS } from '../lib/constants'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import BottomNav from '../components/BottomNav'
import { Building, Home as HomeIcon, Search, Bell, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [newResidents, setNewResidents] = useState([])
  const [showWelcome, setShowWelcome] = useState(true)
  const [events, setEvents] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [pullDistance, setPullDistance] = useState(0)

  function handleTouchStart(e) {
    if (window.scrollY === 0) setTouchStart(e.touches[0].clientY)
  }
  function handleTouchMove(e) {
    if (touchStart === null) return
    const distance = e.touches[0].clientY - touchStart
    if (distance > 0 && distance < 150) setPullDistance(distance)
  }
  async function handleTouchEnd() {
    if (pullDistance > 80) { setRefreshing(true); await fetchPosts(); setRefreshing(false) }
    setTouchStart(null); setPullDistance(0)
  }

  useEffect(() => {
    async function fetchNewResidents() {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase.from('profiles').select('first_name, building, created_at').gte('created_at', oneDayAgo).neq('id', user?.id).order('created_at', { ascending: false })
      setNewResidents(data || [])
    }
    async function fetchEvents() {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('events').select('*').gte('event_date', today).order('event_date').order('event_time').limit(3)
      setEvents(data || [])
    }
    fetchNewResidents()
    fetchEvents()
    const timer = setTimeout(() => setShowWelcome(false), 60000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => { fetchPosts() }, [channel, profile])

  async function fetchPosts() {
    if (!profile) return
    setLoading(true)
    let query = supabase.from('posts').select('*, profile:profiles(id, first_name, last_name, building, role, co_resident_id)').order('created_at', { ascending: false }).limit(50)
    if (channel === CHANNELS.BUILDING) query = query.eq('building', profile.building).eq('channel', CHANNELS.BUILDING)
    else query = query.eq('channel', CHANNELS.RESIDENCE)
    const { data } = await query
    setPosts(data || [])
    setLoading(false)
  }

  const filteredPosts = posts.filter(p => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return p.content?.toLowerCase().includes(s) || p.profile?.first_name?.toLowerCase().includes(s) || p.profile?.last_name?.toLowerCase().includes(s) || p.type?.toLowerCase().includes(s)
  })

  const quickActions = [
    { label: 'Signalements', path: '/posts/signalement', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/singalement%20trans.png' },
    { label: 'Réserver', path: '/bookings', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/reserver%20trans.png' },
    { label: 'Annonces', path: '/posts/annonce', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/annonces%20trans.png' },
    { label: 'Documents', path: '/documents', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/documents%20trans.png' }
  ]

  const EVENT_ICONS = { ag: '📋', conseil: '🏛️', travaux: '🔧', activite: '🎉', info: '📌' }

  return (
    <div className="app-shell" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {pullDistance > 0 && (
        <div style={{ textAlign: 'center', padding: 8, color: 'var(--green-sage)', fontSize: 12 }}>
          {pullDistance > 80 ? 'Relâchez pour actualiser' : 'Tirez pour actualiser'}
        </div>
      )}
      {refreshing && <div style={{ textAlign: 'center', padding: 8, color: 'var(--green-sage)', fontSize: 12 }}>Actualisation...</div>}

      <div className="page-content" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/logo-transparent.png" alt="Harmonie" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', letterSpacing: 1 }}>Harmonie</span>
          </div>
          <button onClick={() => navigate('/calendar')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Bell size={22} color="var(--green-dark)" />
          </button>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 2 }}>
            Bonjour {profile?.first_name} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
            Appartement {profile?.building} · Bâtiment {profile?.building}
          </p>
        </div>

        {/* Quick actions - 2x2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
          {quickActions.map(({ label, path, img }) => (
            <button key={label} onClick={() => navigate(path)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 16,
              background: 'var(--cream)', border: '1px solid var(--border-light)',
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
            }}>
              <img src={img} alt={label} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Today at Harmonie */}
        {events.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 10 }}>
              Aujourd'hui à Harmonie
            </h2>
            {events.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 18 }}>{EVENT_ICONS[ev.event_type] || '📌'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)' }}>{ev.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feed */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Fil d'actualité</h2>
        </div>

        <div className="channel-switch" style={{ marginBottom: 12 }}>
          <button className={`channel-btn ${channel === CHANNELS.BUILDING ? 'active' : ''}`} onClick={() => setChannel(CHANNELS.BUILDING)}>
            <Building size={14} /> Mon bâtiment
          </button>
          <button className={`channel-btn ${channel === CHANNELS.RESIDENCE ? 'active' : ''}`} onClick={() => setChannel(CHANNELS.RESIDENCE)}>
            <HomeIcon size={14} /> Résidence
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--cream)' }} placeholder="Rechercher une publication..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Welcome new residents */}
        {newResidents.length > 0 && showWelcome && (
          <div style={{ background: 'var(--green-sage-10)', border: '1px solid var(--green-sage)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--green-dark)', marginBottom: 4 }}>🌿 Bienvenue aux nouveaux résidents !</div>
            {newResidents.map((r, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--green-sage)' }}>{r.first_name} — Bâtiment {r.building}</div>
            ))}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
            <p style={{ fontSize: 14 }}>{search ? 'Aucun résultat' : 'Aucune publication pour le moment'}</p>
            {!search && <p style={{ fontSize: 12, marginTop: 4 }}>Soyez le premier à publier !</p>}
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} onUpdated={fetchPosts} />
          ))
        )}
      </div>

      {showCreate && <CreatePost onClose={() => setShowCreate(false)} onCreated={fetchPosts} />}
      <BottomNav onPlusClick={() => setShowCreate(true)} />
    </div>
  )
}
