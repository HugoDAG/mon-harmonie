import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { CHANNELS, POST_TYPE_LABELS } from '../lib/constants'
import PostCard from '../components/PostCard'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Building, Home as HomeIcon } from 'lucide-react'

export default function PostsByType() {
  const { type } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const typeInfo = POST_TYPE_LABELS[type] || { label: type }

  useEffect(() => { fetchPosts() }, [channel, profile, type])

  async function fetchPosts() {
    if (!profile) return
    setLoading(true)

    let query = supabase
      .from('posts')
      .select('*, profile:profiles(id, first_name, last_name, building, role, co_resident_id)')
      .eq('type', type)
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

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>{typeInfo.label}s</h1>
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

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>Chargement…</p>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
            <p style={{ fontSize: 14 }}>Aucun {typeInfo.label.toLowerCase()} pour le moment</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
      <BottomNav />
    </div>
  )
}
