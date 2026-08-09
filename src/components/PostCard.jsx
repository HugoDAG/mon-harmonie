import { useState, useEffect } from 'react'
import { POST_TYPE_LABELS } from '../lib/constants'
import { AlertTriangle, Megaphone, Users, BarChart3, Pencil, Check, X, Trash2, ThumbsUp, MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const TYPE_ICONS = {
  annonce: Megaphone,
  signalement: AlertTriangle,
  voisinage: Users,
  sondage: BarChart3
}

function getInitials(profile) {
  if (profile.co_resident_id && profile.co_resident_name) {
    return `${profile.first_name?.[0] || ''}&${profile.co_resident_name?.[0] || ''}`
  }
  const f = profile.first_name?.[0] || ''
  const l = profile.last_name?.[0] || ''
  return `${f}${l}`
}

function getDisplayName(profile) {
  const lastName = profile.last_name ? `${profile.last_name[0]}.` : ''
  if (profile.co_resident_id && profile.co_resident_name) {
    return `${profile.first_name} & ${profile.co_resident_name}`
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
  const { user } = useAuth()
  const { profile, type, content, image_url, created_at } = post
  const typeInfo = POST_TYPE_LABELS[type] || POST_TYPE_LABELS.annonce
  const Icon = TYPE_ICONS[type] || Megaphone
  const avatarStyle = AVATAR_COLORS[type] || AVATAR_COLORS.annonce
  const isSyndic = profile?.role === 'syndic'
  const isOwner = user?.id === post.user_id

  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Likes
  const [likes, setLikes] = useState([])
  const [liked, setLiked] = useState(false)

  // Comments
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Polls
  const [pollOptions, setPollOptions] = useState([])
  const [pollVotes, setPollVotes] = useState([])
  const [userVote, setUserVote] = useState(null)

  const timeAgo = formatTimeAgo(created_at)

  useEffect(() => {
    fetchLikes()
    fetchComments()
    if (type === 'sondage') fetchPoll()
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

  const totalVotes = pollVotes.length

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="avatar" style={{ background: avatarStyle.bg, color: avatarStyle.color }}>
          {isSyndic ? 'SY' : getInitials(profile)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {isSyndic ? 'Syndic' : getDisplayName(profile)}
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
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, background: 'var(--gray-100)', color: 'var(--gray-500)' }}>
                {c.profile?.first_name?.[0]}{c.profile?.last_name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{c.profile?.first_name} {c.profile?.last_name?.[0]}.</span>
                  <span className="building-tag" style={{ fontSize: 10, padding: '1px 5px' }}>{c.profile?.building}</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{formatTimeAgo(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 2 }}>{c.content}</p>
              </div>
              {c.user_id === user?.id && (
                <button onClick={() => deleteComment(c.id)} style={{ background: 'none', border: 'none', color: 'var(--gray-300)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
            <input
              value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="Écrire un commentaire…"
              style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: 13 }}
            />
            <button type="submit" disabled={sendingComment} style={{ background: 'var(--blue-500)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '8px 10px', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)
  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays
