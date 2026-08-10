import { useState, useEffect } from 'react'
import { POST_TYPE_LABELS } from '../lib/constants'
import { AlertTriangle, Megaphone, Users, BarChart3, Pencil, Check, X, Trash2, ThumbsUp, MessageCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const TYPE_ICONS = {
  annonce: Megaphone,
  signalement: AlertTriangle,
  voisinage: Users,
  sondage: BarChart3
}

const STATUS_OPTIONS = [
  { value: 'open', label: '🆕 Nouveau', color: 'var(--blue-500)', bg: 'var(--blue-50)' },
  { value: 'in_progress', label: '⏳ En cours', color: 'var(--amber-500)', bg: 'var(--amber-50)' },
  { value: 'resolved', label: '✅ Résolu', color: 'var(--green-500)', bg: 'var(--green-50)' },
  { value: 'rejected', label: '❌ Rejeté', color: 'var(--red-500)', bg: 'var(--red-50)' }
]

function getInitials(profile, coName) {
  if (profile.co_resident_id && coName) {
    return `${profile.first_name?.[0] || ''}&${coName?.[0] || ''}`
  }
  const f = profile.first_name?.[0] || ''
  const l = profile.last_name?.[0] || ''
  return `${f}${l}`
}

function getDisplayName(profile, coName) {
  const lastName = profile.last_name ? `${profile.last_name[0]}.` : ''
  if (profile.co_resident_id && coName) {
    return `${profile.first_name} & ${coName}`
  }
  return `${profile.first_name} ${lastName}`
}

const AVATAR_COLORS = {
  annonce: { bg: 'var(--blue-50)', color: 'var(--blue-600)' },
  signalement: { bg: 'var(--amber-50)', color: 'var(--amber-600)' },
  voisinage: { bg: 'var(--green-50)', color: 'var(--green-600)' },
  sondage: { bg: 'var(--purple-50)', color: 'var(--purple-500)' }
}

export default function PostCard({ post, onUpdated }) {
  const { user, profile: myProfile } = useAuth()
  const { profile, type, content, image_url, status, created_at } = post
  const typeInfo = POST_TYPE_LABELS[type] || POST_TYPE_LABELS.annonce
  const Icon = TYPE_ICONS[type] || Megaphone
  const avatarStyle = AVATAR_COLORS[type] || AVATAR_COLORS.annonce
  const isSyndic = profile?.role === 'syndic'
  const isOwner = user?.id === post.user_id
  const canChangeStatus = myProfile?.role === 'syndic' || myProfile?.role === 'admin' || myProfile?.role === 'conseil'

  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const [coResidentName, setCoResidentName] = useState(null)

  const [likes, setLikes] = useState([])
  const [liked, setLiked] = useState(false)

  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const [pollOptions, setPollOptions] = useState([])
  const [pollVotes, setPollVotes] = useState([])
  const [userVote, setUserVote] = useState(null)

  const timeAgo = formatTimeAgo(created_at)
  const currentStatus = STATUS_OPTIONS.find(s => s.value === (status || 'open')) || STATUS_OPTIONS[0]

  useEffect(() => {
    fetchLikes()
    fetchComments()
    if (type === 'sondage') fetchPoll()
    if (profile?.co_resident_id) {
      supabase.from('profiles').select('first_name').eq('id', profile.co_resident_id).single()
        .then(({ data }) => { if (data) setCoResidentName(data.first_name) })
    }
  }, [post.id])

  async function fetchLikes() {
    const { data } = await supabase.from('post_likes').select('*').eq('post_id', post.id)
    setLikes(data || [])
    setLiked((data || []).some(l => l.user_id === user?.id))
  }

  async function toggleLike() {
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
    }
    fetchLikes()
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles(first_name, last_name, building)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSendingComment(true)
    await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: newComment.trim() })
    setNewComment('')
    setSendingComment(false)
    fetchComments()
  }

  async function deleteComment(commentId) {
    await supabase.from('comments').delete().eq('id', commentId)
    fetchComments()
  }

  async function fetchPoll() {
    const { data: options } = await supabase.from('poll_options').select('*').eq('post_id', post.id).order('position')
    setPollOptions(options || [])
    const optionIds = (options || []).map(o => o.id)
    if (optionIds.length > 0) {
      const { data: votes } = await supabase.from('poll_votes').select('*').in('option_id', optionIds)
      setPollVotes(votes || [])
      const myVote = (votes || []).find(v => v.user_id === user?.id)
      setUserVote(myVote?.option_id || null)
    }
  }

  async function handleVote(optionId) {
    if (userVote) {
      await supabase.from('poll_votes').delete().eq('option_id', userVote).eq('user_id', user.id)
    }
    if (userVote !== optionId) {
      await supabase.from('poll_votes').insert({ option_id: optionId, user_id: user.id })
    }
    fetchPoll()
  }

  async function handleSave() {
    if (!editContent.trim()) return
    setSaving(true)
    await supabase.from('posts').update({ content: editContent.trim() }).eq('id', post.id)
    setSaving(false)
    setEditing(false)
    onUpdated?.()
  }

  async function handleDelete() {
    await supabase.from('posts').delete().eq('id', post.id)
    onUpdated?.()
  }

  async function handleStatusChange(newStatus) {
    await supabase.from('posts').update({ status: newStatus }).eq('id', post.id)
    setShowStatusMenu(false)
    onUpdated?.()
  }

  const totalVotes = pollVotes.length

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="avatar" style={{ background: avatarStyle.bg, color: avatarStyle.color }}>
          {isSyndic ? 'SY' : getInitials(profile, coResidentName)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {isSyndic ? 'Syndic' : getDisplayName(profile, coResidentName)}
            </span>
            {!isSyndic && profile?.building && (
              <span className="building-tag">{profile.building}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{timeAgo}</div>
        </div>
        {isOwner && !editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setEditing(true); setEditContent(content) }} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>
              <Pencil size={16} />
            </button>
            <button onClick={() => setConfirmDelete(true)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {confirmDelete ? (
        <div style={{ background: 'var(--red-50)', padding: 12, borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--red-500)', marginBottom: 10 }}>Supprimer cette publication ?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: 13 }}>Annuler</button>
            <button onClick={handleDelete} className="btn" style={{ padding: '6px 16px', fontSize: 13, background: 'var(--red-500)', color: '#fff', border: 'none', borderRadius: 'var(--radius)' }}>Supprimer</button>
          </div>
        </div>
      ) : editing ? (
        <div>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 60 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}><X size={14} /> Annuler</button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ padding: '6px 12px', fontSize: 13, width: 'auto' }}><Check size={14} /> {saving ? '…' : 'Enregistrer'}</button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{content}</p>
          {image_url && (
            <img src={image_url} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', marginTop: 10, maxHeight: 300, objectFit: 'cover' }} />
          )}
        </>
      )}

      {/* Statut signalement */}
      {type === 'signalement' && (
        <div style={{ marginTop: 10, position: 'relative' }}>
          {canChangeStatus ? (
            <button onClick={() => setShowStatusMenu(s => !s)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, border: '1px solid ' + currentStatus.color, background: currentStatus.bg, color: currentStatus.color, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              {currentStatus.label} ▾
            </button>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: currentStatus.bg, color: currentStatus.color, fontSize: 12, fontWeight: 500 }}>
              {currentStatus.label}
            </span>
          )}
          {showStatusMenu && (
            <div style={{ position: 'absolute', left: 0, top: 32, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 10, overflow: 'hidden', minWidth: 160 }}>
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => handleStatusChange(opt.value)}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: (status || 'open') === opt.value ? opt.bg : '#fff', color: (status || 'open') === opt.value ? opt.color : 'var(--gray-700)', fontSize: 13, textAlign: 'left', cursor: 'pointer', fontWeight: (status || 'open') === opt.value ? 600 : 400 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Poll */}
      {type === 'sondage' && pollOptions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {pollOptions.map(opt => {
            const voteCount = pollVotes.filter(v => v.option_id === opt.id).length
            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
            const isMyVote = userVote === opt.id
            return (
              <button key={opt.id} onClick={() => handleVote(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px',
                  border: isMyVote ? '2px solid var(--blue-500)' : '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)', marginBottom: 6, background: 'var(--gray-50)',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden', textAlign: 'left'
                }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: isMyVote ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.03)', transition: 'width 0.3s' }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: isMyVote ? 600 : 400, position: 'relative', zIndex: 1 }}>{opt.label}</span>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', position: 'relative', zIndex: 1 }}>{pct}% ({voteCount})</span>
              </button>
            )
          })}
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Tag + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span className="tag" style={{ background: typeInfo.bg, color: typeInfo.color }}>
          <Icon size={12} />
          {typeInfo.label}
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={toggleLike} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: liked ? 'var(--blue-500)' : 'var(--gray-400)', fontSize: 13, cursor: 'pointer' }}>
            <ThumbsUp size={16} fill={liked ? 'var(--blue-500)' : 'none'} /> {likes.length > 0 && likes.length}
          </button>
          <button onClick={() => setShowComments(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: showComments ? 'var(--blue-500)' : 'var(--gray-400)', fontSize: 13, cursor: 'pointer' }}>
            <MessageCircle size={16} /> {comments.length > 0 && comments.length}
          </button>
