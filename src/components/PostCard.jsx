import { useState } from 'react'
import { POST_TYPE_LABELS } from '../lib/constants'
import { AlertTriangle, Megaphone, Users, BarChart3, Pencil, Check, X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const TYPE_ICONS = {
  annonce: Megaphone,
  signalement: AlertTriangle,
  voisinage: Users,
  sondage: BarChart3
}

function getInitials(profile) {
  if (profile.co_resident_id) {
    return `${profile.first_name?.[0] || ''}+`
  }
  const f = profile.first_name?.[0] || ''
  const l = profile.last_name?.[0] || ''
  return `${f}${l}`
}

function getDisplayName(profile) {
  const lastName = profile.last_name ? `${profile.last_name[0]}.` : ''
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

  const timeAgo = formatTimeAgo(created_at)

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
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 60 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>
              <X size={14} /> Annuler
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ padding: '6px 12px', fontSize: 13, width: 'auto' }}>
              <Check size={14} /> {saving ? '…' : 'Enregistrer'}
            </button>
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

      <div style={{ marginTop: 10 }}>
        <span className="tag" style={{ background: typeInfo.bg, color: typeInfo.color }}>
          <Icon size={12} />
          {typeInfo.label}
        </span>
      </div>
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
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
