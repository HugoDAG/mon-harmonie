import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { CHANNELS } from '../lib/constants'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import BottomNav from '../components/BottomNav'
import {
  AlertTriangle, CalendarCheck, FileText, BarChart3,
  Plus, Building, Home as HomeIcon, Users2, Megaphone, Search
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [showFeed, setShowFeed] = useState(true)
  const [newResidents, setNewResidents] = useState([])
  const [showWelcome, setShowWelcome] = useState(true)
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
    fetchNewResidents()
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
    { icon: AlertTriangle, label: 'Signalements', path: '/posts/signalement' },
    { icon: Megaphone, label: 'Annonces', path: '/posts/annonce' },
    { icon: null, label: 'Réserver', path: '/bookings', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/reserver.png' },
    { icon: null, label: 'Voisinage', path: '/posts/voisinage', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/voisinage.png' },
    { icon: BarChart3, label: 'Sondages', path: '/posts/sondage' },
    { icon: null, label: 'Documents', path: '/documents', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/document%20trans.png' }
  ]

  return (
    <div className="app-shell" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {pullDistance > 0 && (
        <div style={{ textAlign: 'center', padding: 8, color: 'var(--green-sage)', fontSize: 12 }}>
          {pullDistance > 80 ? 'Relâchez pour actualiser' : 'Tirez pour actualiser'}
        </div>
      )}
      {refreshing && <div style={{ textAlign: 'center', padding: 8, color: 'var(--green-sage)', fontSize: 12 }}>Actualisation...</div>}

      {/* Hero image */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{
          width: '100%', height: 280,
          backgroundImage: 'url(https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/logo%20fond%20ecran.png)',
          backgroundSize: 'cover', backgroundPosition: 'center'
        }} />
      </div>

      {/* Content card */}
      <div style={{
        background: 'var(--white)',
        borderRadius: '24px 24px 0 0',
        marginTop: -30,
        position: 'relative',
        zIndex: 2,
        minHeight: 'calc(100vh - 250px)'
      }}>
        <div style={{ padding: '24px 16px 100px' }}>
          {/* Welcome text */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 4 }}>
              Bonjour {profile?.first_name} !
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
              Bienvenue dans votre application de copropriété Harmonie.
            </p>
          </div>

          {/* Quick actions */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10, marginBottom: 24
          }}>
            {quickActions.map(({ icon: Icon, label, path, img }) => (
              <button key={label} onClick={() => navigate(path)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '16px 8px', borderRadius: 16,
                background: 'var(--cream)', border: '1px solid var(--border-light)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
                {img ? (
                  <img src={img} alt={label} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'var(--green-dark-10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={20} color="var(--green-sage)" />
                  </div>
                )}
                {!img && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-medium)' }}>{label}</span>}
              </button>
            ))}
          </div>

          {/* Feed section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Fil d'actualité</h2>
            <button onClick={() => setShowFeed(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--green-sage)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
              {showFeed ? 'Masquer' : 'Afficher'}
            </button>
          </div>

          {showFeed && (
            <>
              <div className="channel-switch">
                <button className={`channel-btn ${channel === CHANNELS.BUILDING ? 'active' : ''}`} onClick={() => setChannel(CHANNELS.BUILDING)}>
                  <Building size={15} /> Mon bâtiment
                </button>
                <button className={`channel-btn ${channel === CHANNELS.RESIDENCE ? 'active' : ''}`} onClick={() => setChannel(CHANNELS.RESIDENCE)}>
                  <HomeIcon size={15} /> Résidence
                </button>
              </div>

              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                <input style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--cream)' }} placeholder="Rechercher une publication..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
              ) : filteredPosts.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                  <p style={{ fontSize: 14 }}>{search ? 'Aucun résultat' : 'Aucune publication pour le moment'}</p>
                  {!search && <p style={{ fontSize: 12, marginTop: 4 }}>Soyez le premier à publier !</p>}
                </div>
              ) : (
                <>
                  {filteredPosts.map((post, index) => (
                    <div key={post.id}>
                      <PostCard post={post} onUpdated={fetchPosts} />
                      {index === 0 && newResidents.length > 0 && showWelcome && (
                        <div style={{ background: 'var(--green-sage-10)', border: '1px solid var(--green-sage)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--green-dark)', marginBottom: 4 }}>🌿 Bienvenue aux nouveaux résidents !</div>
                          {newResidents.map((r, i) => (
                            <div key={i} style={{ fontSize: 13, color: 'var(--green-sage)' }}>{r.first_name} — Bâtiment {r.building}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showCreate && <CreatePost onClose={() => setShowCreate(false)} onCreated={fetchPosts} />}
      <BottomNav onPlusClick={() => setShowCreate(true)} />
    </div>
  )
}
