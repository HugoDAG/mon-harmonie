import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { CHANNELS } from '../lib/constants'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import BottomNav from '../components/BottomNav'
import {
  AlertTriangle, CalendarCheck, FileText, BarChart3,
  Plus, Building, Home as HomeIcon, Sun
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { fetchPosts() }, [channel, profile])

  async function fetchPosts() {
    if (!profile) return
    setLoading(true)

    let query = supabase
      .from('posts')
      .select('*, profile:profiles(id, first_name, last_name, building, role, co_resident_id)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (channel === CHANNELS.BUILDING) {
      query = query.eq('building', profile.building).eq('channel', CHANNELS.BUILDING)
    } else {
      query = query.eq('channel', CHANNELS.RESIDENCE)
    }

    const { data } = await query
    setPosts(data || [])
    setLoading(false)
  }

  const quickActions = [
    { icon: AlertTriangle, label: 'Signaler', action: () => setShowCreate(true) },
    { icon: CalendarCheck, label: 'Réserver', path: '/bookings' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: BarChart3, label: 'Sondages', path: '/polls' }
  ]

  return (
    <div className="app-shell">
      <div className="page-content">
        {/* Header */}
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

        {/* Channel switch */}
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

        {/* Quick actions */}
        <div className="quick-grid">
          {quickActions.map(({ icon: Icon, label, path, action }) => (
            <button key={label} className="quick-item" onClick={() => action ? action() : navigate(path)}>
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="section-header">
          <h2>Fil d'actualité</h2>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>Chargement…</p>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
            <p style={{ fontSize: 14 }}>Aucune publication pour le moment</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Soyez le premier à publier !</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}

        {/* FAB */}
        <button
          onClick={() => setShowCreate(true)}
          style={{
            position: 'fixed', bottom: 80, right: 'calc(50% - 220px)',
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
