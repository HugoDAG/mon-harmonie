import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { CHANNELS, POST_TYPE_LABELS } from '../lib/constants'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Building, Home as HomeIcon } from 'lucide-react'

const TAB_LABELS = {
  signalement: ["Fil d'actualité", 'Mes signalements'],
  voisinage: ["Fil d'actualité", 'Mes discussions'],
  annonce: ['Toutes', 'Mes annonces'],
  sondage: ['En cours', 'Mes sondages']
}

const VOISINAGE_FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'entraide', label: '🤝 Entraide' },
  { key: 'covoiturage', label: '🚗 Covoiturage' }
]

export default function PostsByType() {
  const { type } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [tab, setTab] = useState('all')
  const [subFilter, setSubFilter] = useState('all')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const isVoisinage = type === 'voisinage'
  const typeInfo = POST_TYPE_LABELS[type] || { label: type }
  const pageTitle = typeInfo.label + (typeInfo.label.endsWith('s') ? '' : 's')
  const tabs = TAB_LABELS[type] || ['Tout', 'Les miens']

  useEffect(() => { setSubFilter('all') }, [type])
  useEffect(() => { fetchPosts() }, [channel, profile, type, tab, subFilter])

  async function fetchPosts() {
    if (!profile) return
    setLoading(true)

    let query = supabase
      .from('posts')
      .select('*, profile:profiles(id, first_name, last_name, building, role, co_resident_id)')
      .order('created_at', { ascending: false })
      .limit(30)

    if (isVoisinage) {
      if (subFilter === 'entraide') query = query.eq('type', 'voisinage')
      else if (subFilter === 'covoiturage') query = query.eq('type', 'covoiturage')
      else query = query.in('type', ['voisinage', 'covoiturage'])
    } else {
      query = query.eq('type', type)
    }

    if (tab === 'mine') {
      query = query.eq('user_id', user.id)
    } else if (channel === CHANNELS.BUILDING) {
      query = query.eq('building', profile.building).eq('channel', CHANNELS.BUILDING)
    } else {
      query = query.eq('channel', CHANNELS.RESIDENCE)
    }

    const { data } = await query
    setPosts(data || [])
    setLoading(false)
  }

  const defaultCreateType = isVoisinage && subFilter === 'covoiturage' ? 'covoiturage' : type

  const emptyLabel = isVoisinage && subFilter === 'covoiturage'
    ? (tab === 'mine' ? "Vous n'avez pas encore proposé de trajet" : 'Aucun trajet pour le moment')
    : (tab === 'mine' ? `Vous n'avez pas encore de ${typeInfo.label.toLowerCase()}` : `Aucun ${typeInfo.label.toLowerCase()} pour le moment`)

  return (
    <div className="app-shell">
      <div className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>{pageTitle}</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 16, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <button onClick={() => setTab('all')} style={{
            flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
            background: tab === 'all' ? 'var(--green-dark)' : 'var(--white)',
            color: tab === 'all' ? 'var(--cream)' : 'var(--text-medium)'
          }}>{tabs[0]}</button>
          <button onClick={() => setTab('mine')} style={{
            flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
            background: tab === 'mine' ? 'var(--green-dark)' : 'var(--white)',
            color: tab === 'mine' ? 'var(--cream)' : 'var(--text-medium)'
          }}>{tabs[1]}</button>
        </div>

        {/* Sous-filtres Voisinage */}
        {isVoisinage && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
            {VOISINAGE_FILTERS.map(f => (
              <button key={f.key} onClick={() => setSubFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                border: '1px solid ' + (subFilter === f.key ? 'var(--terracotta)' : 'var(--border)'),
                background: subFilter === f.key ? 'rgba(196,121,78,0.1)' : 'var(--white)',
                color: subFilter === f.key ? 'var(--terracotta)' : 'var(--text-medium)'
              }}>{f.label}</button>
            ))}
          </div>
        )}

        {/* Channel switch */}
        {tab === 'all' && (
          <div className="channel-switch" style={{ marginBottom: 12 }}>
            <button className={`channel-btn ${channel === CHANNELS.BUILDING ? 'active' : ''}`} onClick={() => setChannel(CHANNELS.BUILDING)}>
              <Building size={14} /> Mon bâtiment
            </button>
            <button className={`channel-btn ${channel === CHANNELS.RESIDENCE ? 'active' : ''}`} onClick={() => setChannel(CHANNELS.RESIDENCE)}>
              <HomeIcon size={14} /> Résidence
            </button>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
            <p style={{ fontSize: 14 }}>{emptyLabel}</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onUpdated={fetchPosts} />)
        )}
      </div>

      {showCreate && <CreatePost onClose={() => setShowCreate(false)} onCreated={fetchPosts} defaultType={defaultCreateType} />}
      <BottomNav onPlusClick={() => setShowCreate(true)} />
    </div>
  )
}
