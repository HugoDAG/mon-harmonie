import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { CHANNELS } from '../lib/constants'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import BottomNav from '../components/BottomNav'
import {
  AlertTriangle, CalendarCheck, FileText, BarChart3,
  Plus, Building, Home as HomeIcon, Sun, Users2, Megaphone, Search
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPosts() }, [channel, profile])

  async function fetchPosts() {
    if (!profile) return
    setLoading(true)

    let query = supabase
      .from('posts')
      .select('*, profile:profiles(id, first_name, last_name, building, role, co_resident_id)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (channel === CHANNELS.BUILDING) {
      query = query.eq('building', profile.building).eq('channel', CHANNELS.BUILDING)
    } else {
      query = query.eq('channel', CHANNELS.RESIDENCE)
    }

    const { data } = await query
    setPosts(data || [])
    setLoading(false)
  }

  const filteredPosts = posts.filter(p => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return p.content?.toLowerCase().includes(s) ||
      p.profile?.first_name?.toLowerCase().includes(s) ||
      p.profile?.last_name?.toLowerCase().includes(s) ||
      p.type?.toLowerCase().includes(s)
  })

  const quickActions = [
    { icon: AlertTriangle, label: 'Signalements', path: '/posts/signalement' },
    { icon: Users2, label: 'Voisinage', path: '/posts/voisinage' },
    { icon: Megaphone, label: 'Annonces', path: '/posts/annonce' },
    { icon: BarChart3, label: 'Sondages', path: '/posts/sondage' },
    { icon: CalendarCheck, label: 'Réserver', path: '/bookings' },
    { icon: FileText, label: 'Documents', path: '/documents' }
  ]

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              Bonjour {profile?.first_name} <Sun size={20} color="var(--amber-500)" />
            </h1>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
              Bâtiment {profile?.building} — Résidence Harmonie
            </p>
          </div>
          <div className="avatar" style={{ background: 'var(--blue-50)', color: 'var(--blue-600)' }}>
            {profile?.first_name?.[0]}
          </div>
        </div>

        <div className="channel-switch">
          <button
            className={`channel-btn ${channel === CHANNELS.BUILDING ? 'active' : ''}`}
            onClick={() => setChannel(CHANNELS.BUILDING)}
          >
            <Building size={15} /> Mon bâtiment
          </button>
          <button
            className={`channel-btn ${channel === CHANNELS.RESIDENCE ? 'active' : ''}`}
            onClick={() => setChannel(CHANNELS.RESIDENCE)}
          >
            <HomeIcon size={15} /> Résidence
          </button>
        </div>

        <div className="quick-grid">
          {quickActions.map(({ icon: Icon, label, path }) => (
            <button key={label} className="quick-item" onClick={() => navigate(path)}>
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>

        <div className="section-header">
          <h2>Fil d'actualité</h2>
        </div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--gray-400)' }} />
          <input
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--gray-50)' }}
            placeholder="Rechercher une publication…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>Chargement…</p>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
            <p style={{ fontSize: 14 }}>{search ? 'Aucun résultat' : 'Aucune publication pour le moment'}</p>
            {!search && <p style={{ fontSize: 12, marginTop: 4 }}>Soyez le premier à publier !</p>}
          </div>
        ) : (
          filteredPosts.map(post => <PostCard key={post.id} post={post} onUpdated={fetchPosts} />)
        )}

        <button
          onClick={() => setShowCreate(true)}
          style={{
            position: 'fixed', bottom: 90, right: 20,
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--blue-600)', color: '#fff',
            border: 'none', boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 40
          }}
        >
          <Plus size={24} />
        </button>

        {showCreate && (
          <CreatePost onClose={() => setShowCreate(false)} onCreated={fetchPosts} />
        )}
      </div>
      <BottomNav />
    </div>
  )
}
