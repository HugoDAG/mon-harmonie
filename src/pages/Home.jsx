import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { CHANNELS } from '../lib/constants'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import BottomNav from '../components/BottomNav'
import {
  Building, Home as HomeIcon, Search, CalendarDays, CalendarCheck,
  AlertTriangle, BarChart3, CheckCircle2, ChevronRight, Bell, X, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LAST_SEEN_KEY = 'harmonie_last_seen'
const ALERTS_KEY = 'harmonie_alertes_masquees'
const DAY = 24 * 60 * 60 * 1000
// Au-dela de ce delai sans mouvement, un signalement ouvert est considere en souffrance
const STALE_DAYS = 14

function readLastSeen() {
  try { return localStorage.getItem(LAST_SEEN_KEY) } catch { return null }
}
function writeLastSeen() {
  try { localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString()) } catch { /* ignore */ }
}
function readDismissedAlerts() {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]') } catch { return [] }
}

// Evenements qui meritent un rappel en haut de l'accueil, par ordre d'importance
const ALERT_PRIORITY = { ag: 0, encombrants: 1, travaux: 2, conseil: 3 }

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / DAY)
}

function countdownLabel(n) {
  if (n <= 0) return "aujourd'hui"
  if (n === 1) return 'demain'
  return `dans ${n} jours`
}

const EVENT_TYPE_LABELS = {
  ag: 'Assemblée Générale',
  conseil: 'Conseil Syndical',
  travaux: 'Travaux',
  encombrants: 'Encombrants',
  activite: 'Activité',
  info: 'Information'
}

function formatDay(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

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
  const [residentCount, setResidentCount] = useState(0)

  // Nouveautés depuis la dernière visite (figées pour toute la visite en cours)
  const [lastSeen] = useState(() => readLastSeen())
  const [dismissedAlerts, setDismissedAlerts] = useState(() => readDismissedAlerts())
  const [newCounts, setNewCounts] = useState({})
  const [weekly, setWeekly] = useState({
    events: [], bookings: [], openSignalements: 0, staleSignalements: 0,
    resolvedRecent: 0, openSondages: 0
  })
  const [feedEvents, setFeedEvents] = useState([])

  function handleTouchStart(e) {
    if (window.scrollY === 0) setTouchStart(e.touches[0].clientY)
  }
  function handleTouchMove(e) {
    if (touchStart === null) return
    const distance = e.touches[0].clientY - touchStart
    if (distance > 0 && distance < 150) setPullDistance(distance)
  }
  async function handleTouchEnd() {
    if (pullDistance > 80) { setRefreshing(true); await Promise.all([fetchPosts(), fetchSummary()]); setRefreshing(false) }
    setTouchStart(null); setPullDistance(0)
  }

  useEffect(() => {
    async function fetchNewResidents() {
      const oneDayAgo = new Date(Date.now() - DAY).toISOString()
      const { data } = await supabase.from('profiles').select('first_name, building, created_at').gte('created_at', oneDayAgo).neq('id', user?.id).order('created_at', { ascending: false })
      setNewResidents(data || [])
    }
    fetchNewResidents()
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'approved')
      .then(({ count }) => setResidentCount(count || 0))
    const timer = setTimeout(() => setShowWelcome(false), 60000)
    // La visite est enregistrée : au prochain passage, les pastilles repartiront d'ici
    writeLastSeen()
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => { fetchPosts() }, [channel, profile])
  useEffect(() => { fetchSummary() }, [profile])

  function visibleToMe(p) {
    if (!profile) return false
    return p.channel === CHANNELS.RESIDENCE || (p.channel === CHANNELS.BUILDING && p.building === profile.building)
  }

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

  async function fetchSummary() {
    if (!profile) return
    const todayStr = new Date().toISOString().split('T')[0]
    const in7Str = new Date(Date.now() + 7 * DAY).toISOString().split('T')[0]
    const since14 = new Date(Date.now() - 14 * DAY).toISOString()
    const since7 = new Date(Date.now() - 7 * DAY).toISOString()
    const since30 = new Date(Date.now() - 30 * DAY).toISOString()
    const staleCutoff = new Date(Date.now() - STALE_DAYS * DAY).toISOString()

    // Pastilles « nouveau »
    if (lastSeen) {
      const counts = {}
      const { data: recent } = await supabase.from('posts')
        .select('type, channel, building, created_at').gt('created_at', lastSeen)
      ;(recent || []).filter(visibleToMe).forEach(p => {
        const key = p.type === 'covoiturage' ? 'voisinage' : p.type
        counts[key] = (counts[key] || 0) + 1
      })
      const { count: docCount } = await supabase.from('documents')
        .select('id', { count: 'exact', head: true }).gt('created_at', lastSeen)
      if (docCount) counts.documents = docCount
      setNewCounts(counts)
    }

    // Cette semaine + silos connectés
    const [evRes, bkRes, signRes, pollRes, recentEvRes] = await Promise.all([
      supabase.from('events').select('*').gte('event_date', todayStr).lte('event_date', in7Str).order('event_date').order('event_time'),
      supabase.from('bookings').select('*, space:spaces(name), profile:profiles(first_name, last_name)')
        .gte('date', todayStr).lte('date', in7Str).order('date').order('start_time'),
      supabase.from('posts').select('*').eq('type', 'signalement'),
      supabase.from('posts').select('*').eq('type', 'sondage').gte('created_at', since30),
      supabase.from('events').select('*').gte('event_date', todayStr).order('event_date').limit(20)
    ])

    const signs = (signRes.data || []).filter(visibleToMe)
    setWeekly({
      events: evRes.data || [],
      bookings: bkRes.data || [],
      openSignalements: signs.filter(s => !s.status || s.status === 'open' || s.status === 'in_progress').length,
      // Signalements ouverts sans aucun mouvement depuis plus de 14 jours
      staleSignalements: signs.filter(s => {
        if (s.status && s.status !== 'open' && s.status !== 'in_progress') return false
        const move = s.status_updated_at || s.created_at
        return move && move < staleCutoff
      }).length,
      resolvedRecent: signs.filter(s => s.status === 'resolved' && s.status_updated_at && s.status_updated_at > since7).length,
      openSondages: (pollRes.data || []).filter(visibleToMe).length
    })

    // Événements récemment créés : ils remontent dans le fil
    setFeedEvents((recentEvRes.data || []).filter(ev => {
      const created = ev.created_at || `${ev.event_date}T00:00:00`
      return created > since14
    }))
  }

  const filteredPosts = posts.filter(p => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return p.content?.toLowerCase().includes(s) || p.profile?.first_name?.toLowerCase().includes(s) || p.profile?.last_name?.toLowerCase().includes(s) || p.type?.toLowerCase().includes(s)
  })

  // Fil mixte : publications + événements récents, du plus récent au plus ancien
  const feedItems = [
    ...filteredPosts.map(p => ({ kind: 'post', at: p.created_at, key: 'p' + p.id, data: p })),
    ...(search.trim() ? [] : feedEvents.map(e => ({ kind: 'event', at: e.created_at || `${e.event_date}T00:00:00`, key: 'e' + e.id, data: e })))
  ].sort((a, b) => new Date(b.at) - new Date(a.at))

  const quickActions = [
    { label: 'Signalements', path: '/posts/signalement', badge: 'signalement', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/singalement%20trans.png' },
    { label: 'Annonces', path: '/posts/annonce', badge: 'annonce', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/annonces%20trans.png' },
    { label: 'Réserver', path: '/bookings', badge: null, img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/reserver%20trans.png' },
    { label: 'Voisinage', path: '/posts/voisinage', badge: 'voisinage', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/voisinage%20trans.png' },
    { label: 'Sondages', path: '/posts/sondage', badge: 'sondage', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/sondages%20trans.png' },
    { label: 'Documents', path: '/documents', badge: 'documents', img: 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/documents%20trans.png' }
  ]

  // Rappels : evenements importants dans les 7 jours, non masques par le resident
  const alerts = weekly.events
    .filter(ev => ev.event_type in ALERT_PRIORITY)
    .filter(ev => !dismissedAlerts.includes(String(ev.id)))
    .sort((a, b) =>
      (ALERT_PRIORITY[a.event_type] - ALERT_PRIORITY[b.event_type]) ||
      String(a.event_date).localeCompare(String(b.event_date))
    )
    .slice(0, 2)

  function hideAlert(id) {
    const next = [...dismissedAlerts, String(id)]
    setDismissedAlerts(next)
    try { localStorage.setItem(ALERTS_KEY, JSON.stringify(next.slice(-50))) } catch { /* ignore */ }
  }

  // Lignes du bloc « Cette semaine »
  const weekRows = []
  weekly.events.slice(0, 3).forEach(ev => weekRows.push({
    key: 'ev' + ev.id, icon: CalendarDays, color: 'var(--terracotta)',
    title: ev.title,
    meta: formatDay(ev.event_date) + (ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : '') + ` · ${EVENT_TYPE_LABELS[ev.event_type] || ''}`,
    onClick: () => navigate('/calendar')
  }))
  weekly.bookings.slice(0, 2).forEach(b => weekRows.push({
    key: 'bk' + b.id, icon: CalendarCheck, color: 'var(--green-sage)',
    title: b.space?.name || 'Espace commun',
    meta: `${formatDay(b.date)} · ${b.start_time?.slice(0, 5)}–${b.end_time?.slice(0, 5)} · ${b.profile?.first_name || ''} ${b.profile?.last_name?.[0] || ''}.`,
    onClick: () => navigate('/bookings')
  }))
  if (weekly.openSignalements > 0) weekRows.push({
    key: 'sg', icon: AlertTriangle, color: 'var(--amber-500)',
    title: `${weekly.openSignalements} signalement${weekly.openSignalements > 1 ? 's' : ''} en cours`,
    meta: 'Voir où ça en est',
    onClick: () => navigate('/posts/signalement')
  })
  // Les signalements qui dorment ne concernent que ceux qui peuvent agir dessus
  const canManageSignalements = ['conseil', 'syndic', 'admin'].includes(profile?.role)
  if (canManageSignalements && weekly.staleSignalements > 0) weekRows.push({
    key: 'st', icon: Clock, color: 'var(--red-500)',
    title: `${weekly.staleSignalements} signalement${weekly.staleSignalements > 1 ? 's' : ''} sans réponse depuis plus de ${STALE_DAYS} jours`,
    meta: 'À traiter en priorité',
    onClick: () => navigate('/posts/signalement')
  })
  if (weekly.resolvedRecent > 0) weekRows.push({
    key: 'rs', icon: CheckCircle2, color: 'var(--green-500)',
    title: `${weekly.resolvedRecent} signalement${weekly.resolvedRecent > 1 ? 's' : ''} résolu${weekly.resolvedRecent > 1 ? 's' : ''} cette semaine`,
    meta: 'Merci au conseil syndical',
    onClick: () => navigate('/posts/signalement')
  })
  if (weekly.openSondages > 0) weekRows.push({
    key: 'pl', icon: BarChart3, color: 'var(--purple-500)',
    title: `${weekly.openSondages} sondage${weekly.openSondages > 1 ? 's' : ''} en cours`,
    meta: 'Votre voix compte : 1 vote par logement',
    onClick: () => navigate('/posts/sondage')
  })

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
              Bienvenue dans votre application de copropriete Harmonie.
            </p>
            {residentCount > 0 && (
              <p style={{ fontSize: 12, color: 'var(--green-sage)', marginTop: 4, fontWeight: 500 }}>
                🏠 {residentCount} resident{residentCount > 1 ? 's' : ''} inscrit{residentCount > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Rappels : AG, encombrants, travaux, conseil dans les 7 jours */}
          {alerts.map(ev => {
            const n = daysUntil(ev.event_date)
            const urgent = n <= 1
            return (
              <div key={'al' + ev.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                background: urgent ? 'var(--terracotta)' : 'var(--gold)',
                color: urgent ? '#fff' : 'var(--text-dark)',
                borderRadius: 'var(--radius-lg)', padding: '12px 14px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Bell size={18} style={{ flexShrink: 0 }} />
                <button onClick={() => navigate('/calendar')} style={{
                  flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0,
                  textAlign: 'left', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {EVENT_TYPE_LABELS[ev.event_type] || 'Événement'} {countdownLabel(n)}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.title} · {formatDay(ev.event_date)}{ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ''}
                  </div>
                </button>
                <button onClick={() => hideAlert(ev.id)} aria-label="Masquer ce rappel" style={{
                  background: 'none', border: 'none', color: 'inherit', opacity: 0.7,
                  cursor: 'pointer', padding: 4, flexShrink: 0, display: 'flex'
                }}>
                  <X size={15} />
                </button>
              </div>
            )
          })}

          {/* Quick actions */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10, marginBottom: 24
          }}>
            {quickActions.map(({ label, path, img, badge }) => {
              const n = badge ? (newCounts[badge] || 0) : 0
              return (
                <button key={label} onClick={() => navigate(path)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0,
                  padding: '4px', borderRadius: 16,
                  background: 'var(--cream)', border: '1px solid var(--border-light)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  height: 90, overflow: 'hidden', position: 'relative'
                }}>
                  <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                  {n > 0 && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                      background: 'var(--terracotta)', color: '#fff',
                      fontSize: 10, fontWeight: 600, lineHeight: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                    }}>{n > 9 ? '9+' : n}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Cette semaine à Harmonie */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 12 }}>
              Cette semaine à Harmonie
            </h2>
            {weekRows.length === 0 ? (
              <div style={{
                background: 'var(--cream)', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)', padding: '16px 14px',
                fontSize: 13, color: 'var(--text-muted)', textAlign: 'center'
              }}>
                Rien de prévu cette semaine. Tout est calme à la résidence.
              </div>
            ) : (
              <div style={{
                background: 'var(--cream)', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden'
              }}>
                {weekRows.map((row, i) => {
                  const RowIcon = row.icon
                  return (
                    <button key={row.key} onClick={row.onClick} style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '12px 14px', background: 'none', cursor: 'pointer', textAlign: 'left',
                      border: 'none', borderTop: i === 0 ? 'none' : '1px solid var(--border-light)'
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <RowIcon size={16} color={row.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)' }}>{row.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.meta}</div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </button>
                  )
                })}
              </div>
            )}
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
              ) : feedItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                  <p style={{ fontSize: 14 }}>{search ? 'Aucun résultat' : 'Aucune publication pour le moment'}</p>
                  {!search && <p style={{ fontSize: 12, marginTop: 4 }}>Soyez le premier à publier !</p>}
                </div>
              ) : (
                feedItems.map(item => item.kind === 'post' ? (
                  <PostCard
                    key={item.key}
                    post={item.data}
                    isNew={!!lastSeen && item.data.created_at > lastSeen}
                    onUpdated={() => { fetchPosts(); fetchSummary() }}
                  />
                ) : (
                  <button key={item.key} onClick={() => navigate('/calendar')} className="card" style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    textAlign: 'left', cursor: 'pointer',
                    borderLeft: '3px solid var(--terracotta)'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius)', flexShrink: 0,
                      background: 'rgba(196,121,78,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <CalendarDays size={18} color="var(--terracotta)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--terracotta)', fontWeight: 600, letterSpacing: 0.4 }}>
                        {(EVENT_TYPE_LABELS[item.data.event_type] || 'Événement').toUpperCase()}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>{item.data.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDay(item.data.event_date)}{item.data.event_time ? ` · ${item.data.event_time.slice(0, 5)}` : ''}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {showCreate && <CreatePost onClose={() => setShowCreate(false)} onCreated={() => { fetchPosts(); fetchSummary() }} />}
      <BottomNav onPlusClick={() => setShowCreate(true)} />
    </div>
  )
}
